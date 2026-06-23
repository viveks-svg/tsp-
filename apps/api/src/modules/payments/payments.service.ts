import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { ConfigService } from "@nestjs/config";
import { CreatePaymentOrderDto, RefundOrderDto } from "./dto/payments.dto";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {
    this.keyId = this.configService.get<string>("razorpay.keyId") || "";
    this.keySecret = this.configService.get<string>("razorpay.keySecret") || "";
    this.webhookSecret = this.configService.get<string>("razorpay.webhookSecret") || "";
  }

  private isMockMode(): boolean {
    return !this.keyId || !this.keySecret;
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
    const currency = dto.currency || "INR";
    const amountDecimal = new Prisma.Decimal(dto.amount);

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

    if (this.isMockMode()) {
      this.logger.warn("Razorpay credentials missing. Running in MOCK Mode.");
      const mockGatewayOrderId = `order_mock_${crypto.randomUUID()}`;

      const updated = await this.prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { gatewayOrderId: mockGatewayOrderId },
      });

      return {
        ...updated,
        key: "mock-key-id",
        mock: true,
      };
    }

    try {
      const auth = "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({
          amount: Math.round(dto.amount * 100), // convert to paise
          currency,
          receipt: localOrder.id,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay API error: ${errText}`);
      }

      const pgOrder = await response.json();

      const updated = await this.prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { gatewayOrderId: pgOrder.id },
      });

      return {
        ...updated,
        key: this.keyId,
        mock: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create Razorpay order: ${error.message}`);
      await this.prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { status: "FAILED" },
      });
      throw new BadRequestException(`Payment initialization failed: ${error.message}`);
    }
  }

  async verifyPayment(
    userId: string,
    orderId: string, // Local order ID
    gatewayTransactionId: string, // Razorpay payment ID
    signature: string,
  ) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Payment order not found");
    }

    if (order.status === "SUCCESS") {
      return { success: true, message: "Payment already processed", order };
    }

    // Signature verification (skip if mock mode)
    if (!this.isMockMode()) {
      const text = `${order.gatewayOrderId}|${gatewayTransactionId}`;
      const generatedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(text)
        .digest("hex");

      if (generatedSignature !== signature) {
        throw new BadRequestException("Invalid payment signature check failed");
      }
    } else {
      this.logger.warn(`Mock verification accepted for transaction: ${gatewayTransactionId}`);
    }

    // Process completion inside transaction
    return this.prisma.$transaction(async (tx) => {
      // Re-fetch within transaction block
      const currentOrder = await tx.paymentOrder.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || currentOrder.status === "SUCCESS") {
        return { success: true, message: "Order processed concurrently" };
      }

      // Update Order Status
      await tx.paymentOrder.update({
        where: { id: orderId },
        data: { status: "SUCCESS" },
      });

      // Create Payment Transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          gatewayTransactionId,
          gatewaySignature: signature,
          amount: order.amount,
          status: "SUCCESS",
        },
      });

      // Credit User's Wallet with ledger entry
      await this.walletService.creditWallet(
        tx,
        userId,
        order.amount,
        "TOPUP",
        `Wallet top-up of ${order.amount} via Razorpay transaction ${gatewayTransactionId}`,
        transaction.id,
      );

      return {
        success: true,
        message: "Payment verified and credited to wallet",
        transactionId: transaction.id,
      };
    });
  }

  async handleWebhook(rawBody: string, signature: string) {
    if (!this.isMockMode() && this.webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new BadRequestException("Invalid webhook signature");
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    this.logger.log(`Received Webhook event: ${event}`);

    // We process "order.paid" or "payment.captured"
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
        this.logger.warn(`Order not found for gateway order ID: ${pgOrderId}`);
        return { success: false, message: "Order not found" };
      }

      if (order.status === "SUCCESS") {
        return { success: true, message: "Already processed" };
      }

      // Verify and process payment
      await this.verifyPayment(order.userId, order.id, pgPaymentId, signature || "WEBHOOK_VERIFIED");
      return { success: true, message: "Processed successfully" };
    }

    return { success: true, message: "Unhandled event" };
  }

  async processRefund(dto: RefundOrderDto) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: dto.paymentTransactionId },
      include: {
        order: true,
        refunds: true,
      },
    });

    if (!transaction || transaction.status !== "SUCCESS") {
      throw new BadRequestException("Invalid or unsuccessful transaction ID for refund");
    }

    const refundAmount = new Prisma.Decimal(dto.amount);

    // Calculate existing refunds total
    const totalRefunded = transaction.refunds
      .filter((r) => r.status === "SUCCESS")
      .reduce((sum, r) => sum.plus(r.amount), new Prisma.Decimal(0));

    const remainingRefundable = transaction.amount.minus(totalRefunded);

    if (refundAmount.greaterThan(remainingRefundable)) {
      throw new BadRequestException(
        `Refund amount ${refundAmount} exceeds maximum remaining refundable amount: ${remainingRefundable}`,
      );
    }

    let gatewayRefundId = `ref_mock_${crypto.randomUUID()}`;

    // If keys exist, dispatch to Razorpay
    if (!this.isMockMode() && transaction.gatewayTransactionId) {
      try {
        const auth = "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
        const response = await fetch(`https://api.razorpay.com/v1/payments/${transaction.gatewayTransactionId}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth,
          },
          body: JSON.stringify({
            amount: Math.round(dto.amount * 100), // paise
            notes: {
              reason: dto.reason || "Partial Refund",
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Razorpay Refund API error: ${errText}`);
        }

        const pgRefund = await response.json();
        gatewayRefundId = pgRefund.id;
      } catch (error: any) {
        this.logger.error(`Failed to execute gateway refund: ${error.message}`);
        throw new BadRequestException(`Gateway refund request failed: ${error.message}`);
      }
    }

    // Record Refund and Debit Wallet inside database transaction
    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          transactionId: transaction.id,
          amount: refundAmount,
          status: "SUCCESS",
          gatewayRefundId,
          reason: dto.reason || "Requested Refund",
        },
      });

      // Debit wallet with ledger entry
      await this.walletService.debitWallet(
        tx,
        transaction.order.userId,
        refundAmount,
        "REFUND",
        `Wallet debit for refund of ${refundAmount} (Refund ID: ${refund.id})`,
        refund.id,
      );

      return refund;
    });
  }
}
