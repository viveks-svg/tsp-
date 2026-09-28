import { Injectable, NotFoundException, BadRequestException, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { CreatePaymentOrderDto } from "./dto/payments.dto";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";
import { RazorpayService } from "./razorpay.service";

/**
 * Wallet top-ups through Razorpay. Refunds of top-ups are money requests
 * (see finance/money-actions.service.ts) so they follow the approval rules.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly razorpay: RazorpayService,
  ) {}

  /** Without keys, fake payments are allowed only outside production (local testing). */
  private async mockAllowed() {
    return process.env.NODE_ENV !== "production" && !(await this.razorpay.isConfigured());
  }

  async getOrders(userId: string) {
    return this.prisma.paymentOrder.findMany({
      where: { userId },
      include: {
        transactions: {
          include: {
            refunds: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createOrder(userId: string, dto: CreatePaymentOrderDto) {
    const currency = "INR"; // the wallet is credited in rupees
    const amountDecimal = new Prisma.Decimal(dto.amount);
    const configured = await this.razorpay.isConfigured();
    if (!configured && !(await this.mockAllowed())) {
      throw new ServiceUnavailableException("Online payments are not configured yet.");
    }

    // Create local pending order
    const localOrder = await this.prisma.paymentOrder.create({
      data: {
        userId,
        amount: amountDecimal,
        currency,
        status: "PENDING",
        gatewayProvider: "RAZORPAY",
      },
    });

    if (!configured) {
      this.logger.warn("Razorpay credentials missing. Running in MOCK Mode (non-production).");
      const updated = await this.prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { gatewayOrderId: `order_mock_${crypto.randomUUID()}` },
      });
      return { ...updated, key: "mock-key-id", mock: true };
    }

    try {
      const pgOrder = await this.razorpay.createOrder(Math.round(dto.amount * 100), currency, localOrder.id);
      const updated = await this.prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { gatewayOrderId: pgOrder.id },
      });
      return { ...updated, key: await this.razorpay.getKeyId(), mock: false };
    } catch (error: any) {
      this.logger.error(`Failed to create Razorpay order: ${error.message}`);
      await this.prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { status: "FAILED" },
      });
      throw new BadRequestException("Could not start the payment. Please try again in a moment.");
    }
  }

  /** Called by the browser after Razorpay checkout closes. */
  async verifyPayment(
    userId: string,
    orderId: string, // Local order ID
    gatewayTransactionId: string, // Razorpay payment ID
    signature: string,
  ) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException("Payment order not found");
    }

    if (order.status === "SUCCESS") {
      return { success: true, message: "Payment already processed", order };
    }

    if (await this.razorpay.isConfigured()) {
      const valid = await this.razorpay.verifySignature(order.gatewayOrderId ?? "", gatewayTransactionId, signature);
      if (!valid) {
        throw new BadRequestException("Invalid payment signature check failed");
      }
    } else if (await this.mockAllowed()) {
      this.logger.warn(`Mock verification accepted for transaction: ${gatewayTransactionId}`);
    } else {
      throw new ServiceUnavailableException("Online payments are not configured yet.");
    }

    return this.completeTopup(order.id, gatewayTransactionId, signature);
  }

  /** Credits the wallet once per order (browser verify and webhook may both arrive). */
  private async completeTopup(orderId: string, gatewayTransactionId: string, signature: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const currentOrder = await tx.paymentOrder.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || currentOrder.status === "SUCCESS") {
        return { success: true, message: "Order processed concurrently" };
      }

      await tx.paymentOrder.update({
        where: { id: orderId },
        data: { status: "SUCCESS" },
      });

      const transaction = await tx.paymentTransaction.create({
        data: {
          orderId,
          gatewayTransactionId,
          gatewaySignature: signature,
          amount: currentOrder.amount,
          status: "SUCCESS",
        },
      });

      await this.walletService.creditWallet(
        tx,
        currentOrder.userId,
        currentOrder.amount,
        "TOPUP",
        `Wallet top-up of ${currentOrder.amount} via Razorpay transaction ${gatewayTransactionId}`,
        transaction.id,
      );

      return {
        success: true,
        message: "Payment verified and credited to wallet",
        transactionId: transaction.id,
      };
    });
  }

  /** Razorpay server-to-server notification; completes top-ups even if the browser never returned. */
  async handleWebhook(rawBody: string, signature: string) {
    if (!(await this.razorpay.verifyWebhookSignature(rawBody, signature))) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    this.logger.log(`Received Webhook event: ${event}`);

    if (event === "order.paid" || event === "payment.captured") {
      const pgOrderId = payload.payload.payment?.entity?.order_id || payload.payload.order?.entity?.id;
      const pgPaymentId = payload.payload.payment?.entity?.id;

      if (!pgOrderId || !pgPaymentId) {
        return { success: false, message: "Missing identifiers in webhook" };
      }

      const order = await this.prisma.paymentOrder.findUnique({
        where: { gatewayOrderId: pgOrderId },
      });

      if (!order) {
        // Not a wallet top-up (bookings and shop are handled elsewhere).
        return { success: true, message: "Not a wallet order" };
      }

      if (order.status === "SUCCESS") {
        return { success: true, message: "Already processed" };
      }

      await this.completeTopup(order.id, pgPaymentId, null);
      return { success: true, message: "Processed successfully" };
    }

    return { success: true, message: "Unhandled event" };
  }
}
