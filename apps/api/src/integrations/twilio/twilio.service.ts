import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TwilioService {
  constructor(private readonly configService: ConfigService) {}

  async sendSms(to: string, message: string) {
    // Placeholder logic for Twilio SMS sending
    return { sid: "fake_sms_sid", status: "queued" };
  }
}
