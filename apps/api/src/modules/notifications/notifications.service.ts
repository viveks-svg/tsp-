import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY || "";
  private readonly twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
  private readonly twilioToken = process.env.TWILIO_AUTH_TOKEN || "";
  private readonly twilioFrom = process.env.TWILIO_FROM_NUMBER || "";

  constructor(private readonly prisma: PrismaService) { }

  async sendOrderConfirmationEmail(toEmail: string, customerName: string, orderId: string, totalAmount: number) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: toEmail,
          subject: `Order Confirmation - Time Space & Planets`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Namaste, ${customerName}!</h2>
              <p>Thank you for your order. We have successfully received your payment.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Total Amount Paid:</strong> ₹${totalAmount}</p>
              <br/>
              <p>Our Pandits will soon begin planetary energization calculations if applicable. You can track your orders in your dashboard.</p>
              <p>Divine Blessings,<br/>Time Space & Planets Team</p>
            </div>
          `
        })
      });
      if (!response.ok) {
        this.logger.error(`Resend API Error: ${await response.text()}`);
      }
    } catch (e) {
      this.logger.error("Failed to send order email", e);
    }
  }

  async sendOrderConfirmationSMS(toNumber: string, customerName: string, orderId: string) {
    try {
      // Ensure phone number starts with country code, default to +91
      let phone = toNumber.trim();
      if (!phone.startsWith("+")) {
        phone = `+91${phone}`;
      }

      const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString("base64");

      const bodyParams = new URLSearchParams();
      bodyParams.append("To", phone);
      bodyParams.append("From", this.twilioFrom);
      bodyParams.append("Body", `Namaste ${customerName}, your order (${orderId}) at TSP has been confirmed! Log in to view details.`);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });

      if (!response.ok) {
        this.logger.error(`Twilio API Error: ${await response.text()}`);
      }
    } catch (e) {
      this.logger.error("Failed to send order SMS", e);
    }
  }
}
