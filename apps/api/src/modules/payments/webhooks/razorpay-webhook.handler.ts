import { Controller, Post, Req, Res, Headers, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';
import { RazorpayService } from '../razorpay.service';
import { PrismaService } from '../../../database/prisma.service';
import { BookingStatus } from '@prisma/client';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('webhooks/razorpay')
export class RazorpayWebhookHandler {
  constructor(
    private rzp: RazorpayService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // Note: this assumes rawBody is accessible (depends on NestJS configuration)
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (!this.rzp.verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === 'payment.captured') {
      const orderId = payload.payload.payment.entity.order_id;
      const paymentId = payload.payload.payment.entity.id;
      const amountPaise = payload.payload.payment.entity.amount;

      const booking = await this.prisma.booking.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (booking && booking.status !== BookingStatus.CONFIRMED) {
        await this.prisma.$transaction([
          this.prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CONFIRMED,
              razorpayPaymentId: paymentId,
              confirmedAt: new Date(),
            },
          }),
          this.prisma.paymentEvent.create({
            data: {
              bookingId: booking.id,
              eventType: 'PAYMENT_CAPTURED',
              razorpayEventId: paymentId,
              amountPaise,
              rawPayload: payload,
            },
          }),
        ]);
      }
    }

    if (event === 'payment.failed') {
      const orderId = payload.payload.payment.entity.order_id;
      const paymentId = payload.payload.payment.entity.id;

      const booking = await this.prisma.booking.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (booking) {
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
    }

    return res.status(200).json({ received: true });
  }
}
