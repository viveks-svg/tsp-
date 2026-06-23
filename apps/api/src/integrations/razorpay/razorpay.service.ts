import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RazorpayService {
  constructor(private readonly configService: ConfigService) {}

  async createOrder(amount: number, currency = "INR") {
    // Placeholder logic for Razorpay order creation
    return {
      id: "fake_order_id",
      amount: amount * 100,
      currency,
    };
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    // Placeholder signature verification
    return true;
  }
}
