import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { FirebaseService } from "../firebase/firebase.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { NotificationType } from "@prisma/client";
import twilio from "twilio";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY || "";
  private readonly twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
  private readonly twilioToken = process.env.TWILIO_AUTH_TOKEN || "";
  private readonly twilioFrom = process.env.TWILIO_FROM_NUMBER || "";

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) { }

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

  async sendOrderConfirmationSMS(toNumber: string, customerName: string, orderId: string, scheduledDate?: Date | null) {
    try {
      // Ensure phone number starts with country code, default to +91
      let phone = toNumber.trim();
      if (!phone.startsWith("+")) {
        phone = `+91${phone}`;
      }

      const accountSid = this.twilioSid;
      const authToken = this.twilioToken;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      let dateStr = "TBD";
      let timeStr = "TBD";
      
      if (scheduledDate) {
        const dateObj = new Date(scheduledDate);
        // format like "July 21"
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        dateStr = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
        
        // format like "3PM"
        let hours = dateObj.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        timeStr = `${hours}${ampm}`;
      }

      const bodyParams = new URLSearchParams();
      bodyParams.append("To", `whatsapp:${phone}`);
      bodyParams.append("From", "whatsapp:+14155238886");
      bodyParams.append("Body", `Your appointment is coming up on ${dateStr} at ${timeStr}`);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });

      if (!response.ok) {
        this.logger.error(`Twilio API Error: ${await response.text()}`);
      } else {
        const data = await response.json();
        this.logger.log(`WhatsApp confirmation sent to ${phone}: ${data.sid}`);
      }
    } catch (e) {
      this.logger.error("Failed to send order WhatsApp", e);
    }
  }

  /**
   * Send a push notification to all ADMIN users when a booking is confirmed.
   */
  async sendAdminBookingNotification(
    customerName: string,
    serviceName: string,
    bookingId: string,
    scheduledDate?: Date | null,
  ) {
    try {
      // Fetch all admin users with registered FCM tokens
      const admins = await this.prisma.user.findMany({
        where: {
          role: "ADMIN",
          fcmTokens: { isEmpty: false },
        },
        select: { id: true, fcmTokens: true },
      });

      // Collect all tokens across all admins
      const allTokens = admins.flatMap((admin) => admin.fcmTokens);

      if (allTokens.length === 0) {
        this.logger.warn("No admin FCM tokens registered — skipping push notification.");
        return;
      }

      const dateStr = scheduledDate
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(scheduledDate))
        : "TBD";

      const messaging = this.firebaseService.getMessaging();

      const response = await messaging.sendEachForMulticast({
        tokens: allTokens,
        notification: {
          title: "🔔 New Booking Received",
          body: `${customerName} has booked "${serviceName}" for ${dateStr}.`,
        },
        data: {
          bookingId,
          type: "NEW_BOOKING",
        },
        webpush: {
          fcmOptions: {
            link: "/astrologer/dashboard",
          },
        },
      });

      this.logger.log(
        `Admin push notification sent: ${response.successCount} success, ${response.failureCount} failures`,
      );

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (resp.error) {
            const code = resp.error.code;
            this.logger.error(`FCM Push Error for token ${allTokens[idx]}: ${code} - ${resp.error.message}`);
            // Let's aggressively clean up ANY token that returns an error to be safe
            invalidTokens.push(allTokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          this.logger.log(`Removing ${invalidTokens.length} invalid FCM token(s).`);
          // Remove invalid tokens from all admins
          for (const admin of admins) {
            const cleaned = admin.fcmTokens.filter((t) => !invalidTokens.includes(t));
            if (cleaned.length !== admin.fcmTokens.length) {
              await this.prisma.user.update({
                where: { id: admin.id },
                data: { fcmTokens: cleaned },
              });
            }
          }
        }
      }
    } catch (e) {
      this.logger.error("Failed to send admin push notification", e);
    }
  }

  /**
   * Send a test push notification to the current user's registered FCM tokens.
   */
  async sendTestPushNotification(userId: string, title?: string, body?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmTokens: true, name: true, email: true },
      });

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        return {
          success: false,
          message: "No registered FCM tokens found for your user account. Please enable notifications in your browser first.",
          fcmTokensCount: 0,
        };
      }

      const messaging = this.firebaseService.getMessaging();
      const notifTitle = title || "🔔 Test Push Notification";
      const notifBody = body || `Hello ${user.name || 'User'}! Push notifications are working on Time Space & Planets.`;

      const response = await messaging.sendEachForMulticast({
        tokens: user.fcmTokens,
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        data: {
          type: "TEST_NOTIFICATION",
          timestamp: new Date().toISOString(),
        },
        webpush: {
          fcmOptions: {
            link: "/",
          },
        },
      });

      this.logger.log(
        `Test push notification for user ${userId}: ${response.successCount} success, ${response.failureCount} failures`,
      );

      return {
        success: response.successCount > 0,
        message: `Push notification sent (${response.successCount} success, ${response.failureCount} failures)`,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: user.fcmTokens.length,
      };
    } catch (e: any) {
      this.logger.error("Failed to send test push notification", e);
      return {
        success: false,
        message: e.message || "Failed to send push notification",
      };
    }
  }

  // ─── IN-APP NOTIFICATIONS ────────────────────────────────────────────────────

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: any,
  ) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          metadata: metadata || {},
        },
      });

      // Emit to connected client in real-time
      this.realtimeGateway.emitNotificationToUser(userId, notification);

      return notification;
    } catch (e) {
      this.logger.error("Failed to create in-app notification", e);
      // We don't throw here to avoid breaking core flows like payments
      return null;
    }
  }

  async getUserNotifications(userId: string, unreadOnly: boolean, limit: number) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    // Verify ownership
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return null; // Or throw NotFound/Forbidden
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async makeUserAdmin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
