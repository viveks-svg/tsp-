import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService implements OnModuleInit {
  private razorpay!: Razorpay;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const keyId = this.config.get('razorpay.keyId') || this.config.get('RAZORPAY_KEY_ID') || '';
    const keySecret = this.config.get('razorpay.keySecret') || this.config.get('RAZORPAY_KEY_SECRET') || '';
    this.razorpay = new Razorpay({
      key_id: keyId.trim(),
      key_secret: keySecret.trim(),
    });
  }

  async createOrder(amountPaise: number, currency = 'INR', receiptId: string) {
    try {
      return await this.razorpay.orders.create({
        amount: amountPaise,
        currency,
        receipt: receiptId,
      });
    } catch (error: any) {
      console.error('[RazorpayService] Order creation error:', error);
      throw error;
    }
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.get('razorpay.keySecret') || this.config.get('RAZORPAY_KEY_SECRET') || '')
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.config.get('razorpay.webhookSecret') || this.config.get('RAZORPAY_WEBHOOK_SECRET') || '')
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}
