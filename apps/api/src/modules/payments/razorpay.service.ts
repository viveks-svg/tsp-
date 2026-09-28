import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';
import { FinanceSettingsService, RazorpayCredentials } from '../finance/finance-settings.service';

/**
 * The one place that talks to Razorpay. Credentials come from the admin
 * settings (or the server's .env) on every call, so changing keys in the admin
 * panel takes effect without a redeploy.
 */
@Injectable()
export class RazorpayService {
  constructor(private readonly settings: FinanceSettingsService) {}

  async isConfigured() {
    return (await this.settings.getRazorpay()) !== null;
  }

  /** The public key id checkout must open with (matches the account that created the order). */
  async getKeyId() {
    return (await this.settings.getRazorpay())?.keyId ?? null;
  }

  private async creds(): Promise<RazorpayCredentials> {
    const c = await this.settings.getRazorpay();
    if (!c) throw new ServiceUnavailableException('Online payments are not configured yet.');
    return c;
  }

  private async call<T>(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<T> {
    const c = await this.creds();
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: init.method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${c.keyId}:${c.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await res.json().catch(() => null)) as (T & { error?: { description?: string } }) | null;
    if (!res.ok) {
      throw new Error(json?.error?.description || `Razorpay replied ${res.status}`);
    }
    return json as T;
  }

  async createOrder(amountPaise: number, currency = 'INR', receiptId: string) {
    return this.call<{ id: string; amount: number; currency: string; status: string }>('/orders', {
      method: 'POST',
      body: { amount: amountPaise, currency, receipt: receiptId },
    });
  }

  /** Refunds (part of) a captured payment. */
  async refund(paymentId: string, amountPaise: number, notes: Record<string, string> = {}) {
    return this.call<{ id: string; status: string; amount: number }>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: { amount: amountPaise, notes },
    });
  }

  /** Checkout signature: HMAC(order_id|payment_id) with the key secret. */
  async verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const c = await this.settings.getRazorpay();
    if (!c || !signature) return false;
    const expected = crypto.createHmac('sha256', c.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
  }

  /** Webhook signature. Without a webhook secret no webhook is trusted. */
  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    const c = await this.settings.getRazorpay();
    if (!c?.webhookSecret || !signature) return false;
    const expected = crypto.createHmac('sha256', c.webhookSecret).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
  }
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
