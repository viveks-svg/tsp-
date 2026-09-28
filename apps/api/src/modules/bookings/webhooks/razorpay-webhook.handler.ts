import { Controller, Post, Req, Res, Headers, RawBodyRequest, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { RazorpayService } from '../../payments/razorpay.service';
import { PrismaService } from '../../../database/prisma.service';
import { LeadsService } from '../../leads/leads.service';
import { Public } from '../../../common/decorators/public.decorator';
import { BookingsService } from '../bookings.service';
import { ShopService } from '../../shop/shop.service';

/**
 * Razorpay → bookings. Confirms a booking whose checkout the client closed
 * before our page could (the browser callback and this webhook race; whichever
 * is first confirms, the other finds it done). Signed by Razorpay's webhook
 * secret over the raw body; never throttled, so Razorpay's retries get through.
 */
@Controller('webhooks/razorpay')
export class RazorpayWebhookHandler {
  private readonly logger = new Logger(RazorpayWebhookHandler.name);

  constructor(
    private rzp: RazorpayService,
    private prisma: PrismaService,
    private leads: LeadsService,
    private bookings: BookingsService,
    private shop: ShopService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // Signatures are over the exact bytes Razorpay sent (main.ts enables rawBody).
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody || !(await this.rzp.verifyWebhookSignature(rawBody, signature))) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const payment = payload.payload?.payment?.entity;
    const orderId: string | undefined = payment?.order_id;
    const paymentId: string | undefined = payment?.id;

    // Payments without one of our orders (payment links, QR codes) aren't bookings.
    if (!orderId || !paymentId) return res.status(200).json({ received: true });

    const booking = await this.prisma.booking.findUnique({ where: { razorpayOrderId: orderId } });
    if (!booking) {
      // Not a booking: maybe a shop order whose buyer closed the tab after paying.
      if (event === 'payment.captured') await this.confirmShopOrder(orderId, paymentId, payment);
      return res.status(200).json({ received: true });
    }

    if (event === 'payment.captured') {
      if (payment.amount !== booking.totalAmountPaise || payment.currency !== 'INR') {
        this.logger.error(
          `Booking ${booking.id}: captured ${payment.amount} ${payment.currency}, expected ${booking.totalAmountPaise} INR — not confirmed`,
        );
        await this.prisma.paymentEvent.create({
          data: { bookingId: booking.id, eventType: 'AMOUNT_MISMATCH', razorpayEventId: paymentId, amountPaise: payment.amount ?? 0, rawPayload: payload },
        });
        return res.status(200).json({ received: true });
      }

      const outcome = await this.bookings.confirmPaid(booking.id, orderId, paymentId, { rawPayload: payload });
      if (outcome === 'NOT_PENDING') {
        // Paid after the booking was cancelled or already paid another way: needs a person.
        this.logger.warn(`Booking ${booking.id} (${booking.status}) received payment ${paymentId}; check and refund if needed`);
      }

      if (outcome === 'CONFIRMED') {
        // The lead that led to this booking (same phone and service), if any.
        try {
          const matchedLead = await this.prisma.bookingLead.findFirst({
            where: { phone: booking.phone, solutionSlug: booking.serviceSlug, status: { not: 'CONVERTED' } },
            orderBy: { createdAt: 'desc' },
          });
          if (matchedLead) await this.leads.markConverted({ sessionId: matchedLead.sessionId, bookingId: booking.id });
        } catch (e) {
          this.logger.error('Failed to mark lead as converted', e as Error);
        }
      }
    }

    if (event === 'payment.failed') {
      await this.prisma.paymentEvent.create({
        data: {
          bookingId: booking.id,
          eventType: 'PAYMENT_FAILED',
          razorpayEventId: paymentId,
          amountPaise: booking.totalAmountPaise,
          rawPayload: payload,
        },
      });
    }

    return res.status(200).json({ received: true });
  }

  private async confirmShopOrder(orderId: string, paymentId: string, payment: { amount?: number; currency?: string }) {
    const order = await this.prisma.shopOrder.findUnique({ where: { razorpayOrderId: orderId } });
    if (!order) return;
    const expected = Math.round(Number(order.totalAmount) * 100);
    if (payment.amount !== expected || payment.currency !== 'INR') {
      this.logger.error(`Shop order ${order.id}: captured ${payment.amount} ${payment.currency}, expected ${expected} INR — not confirmed`);
      return;
    }
    const outcome = await this.shop.markPaid(orderId, paymentId);
    if (outcome.result === 'NOT_PENDING') {
      this.logger.warn(`Shop order ${order.id} (${order.status}) received payment ${paymentId}; check and refund if needed`);
    }
  }
}
