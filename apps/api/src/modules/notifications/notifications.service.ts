import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { escapeHtml } from "../../common/html";
import { PrismaService } from "../../database/prisma.service";
import { FirebaseService } from "../firebase/firebase.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { NotificationType } from "@prisma/client";
import { MailService } from "../mail/mail.service";
import { parseSlotLabel, formatSlotLabel } from "../schedule/slot-label";

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const site = () => (process.env.FRONTEND_URL || "https://timespaceplanets.com").replace(/\/$/, "");
const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "there";
/** Booking dates are calendar days stored at 00:00 UTC. */
const calendarDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d));
const slotText = (label: string) => {
  const range = parseSlotLabel(label);
  return `${range ? formatSlotLabel(range) : label} IST`;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
  private readonly twilioToken = process.env.TWILIO_AUTH_TOKEN || "";

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly mail: MailService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) { }

  // ── Client confirmations ─────────────────────────────────────────────────

  /** Email + WhatsApp to a client whose booking is paid and confirmed. */
  async sendBookingConfirmation(b: {
    id: string;
    email: string;
    phone: string;
    fullName: string;
    serviceName: string;
    scheduledDate: Date | null;
    scheduledSlot: string | null;
    totalAmountPaise: number;
    meetLink?: string | null;
  }) {
    const when = b.scheduledDate
      ? `${calendarDate(b.scheduledDate)}${b.scheduledSlot ? `, ${slotText(b.scheduledSlot)}` : ""}`
      : null;
    const ref = b.id.slice(-8).toUpperCase();
    void this.mail.sendActionEmail(b.email, {
      subject: `Your ${b.serviceName} is confirmed — Time Space & Planets`,
      greetingName: b.fullName,
      paragraphs: [
        "Thank you — your payment is received and your session with Dr. Pradeep Sharma is confirmed.",
        b.meetLink
          ? "Join the video session from the link below a few minutes before the time."
          : b.scheduledDate
            ? "We'll send your video session link before the session."
            : "Our team will begin preparing and will contact you with next steps.",
      ],
      details: [
        ["Service", b.serviceName],
        ...(when ? ([["When", when]] as [string, string][]) : []),
        ["Amount paid", inr(b.totalAmountPaise / 100)],
        ["Booking reference", ref],
      ],
      ...(b.meetLink
        ? { buttonText: "Join video session", link: b.meetLink }
        : { buttonText: "View my bookings", link: `${site()}/orders` }),
      footnote: "Need to change something? Reply to this email or write to us from the website.",
    });
    void this.sendWhatsApp(
      b.phone,
      `Namaste ${firstName(b.fullName)}, your ${b.serviceName} with Dr. Pradeep Sharma is confirmed` +
        (when ? ` for ${when}` : "") +
        `. Ref ${ref}.` +
        (b.meetLink ? ` Join: ${b.meetLink}` : "") +
        " — Time Space & Planets",
    );
  }

  /** Email + WhatsApp to a client whose shop order is paid. */
  async sendShopOrderConfirmation(o: {
    id: string;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
    totalAmount: number;
    items: { productName: string; quantity: number }[];
  }) {
    const ref = o.id.slice(-8).toUpperCase();
    void this.mail.sendActionEmail(o.customerEmail, {
      subject: `Order ${ref} received — Time Space & Planets`,
      greetingName: o.customerName,
      paragraphs: [
        "Thank you — your payment is received. We'll prepare your order and let you know when it ships.",
      ],
      details: [
        ...o.items.map((i) => [i.productName, `× ${i.quantity}`] as [string, string]),
        ["Amount paid", inr(o.totalAmount)],
        ["Order reference", ref],
      ],
      buttonText: "View my orders",
      link: `${site()}/orders`,
    });
    void this.sendWhatsApp(
      o.customerPhone,
      `Namaste ${firstName(o.customerName)}, we've received your order ${ref} (${inr(o.totalAmount)}). ` +
        "We'll message you when it ships. — Time Space & Planets",
    );
  }

  /**
   * WhatsApp through Twilio, only when a production sender is configured
   * (TWILIO_WHATSAPP_FROM, e.g. "whatsapp:+9198xxxxxxxx", approved by Meta).
   * Without it nothing is sent: Twilio's sandbox only reaches test phones.
   */
  private async sendWhatsApp(toNumber: string, body: string) {
    const from = (process.env.TWILIO_WHATSAPP_FROM || "").trim();
    if (!from || !this.twilioSid || !this.twilioToken || !toNumber) return;
    try {
      let phone = toNumber.trim().replace(/\s+/g, "");
      if (!phone.startsWith("+")) phone = `+91${phone}`;
      const params = new URLSearchParams();
      params.append("To", `whatsapp:${phone}`);
      params.append("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
      params.append("Body", body);
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!response.ok) this.logger.error(`Twilio WhatsApp error: ${await response.text()}`);
    } catch (e) {
      this.logger.error("Failed to send WhatsApp", e as Error);
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
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
            sound: "default",
          },
        },
        webpush: {
          fcmOptions: {
            link: "/admin",
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
            // Clean up tokens that are invalid, unregistered, or mismatched with our current Firebase project
            if (
              code === "messaging/invalid-registration-token" || 
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/mismatched-credential"
            ) {
              invalidTokens.push(allTokens[idx]);
            }
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
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
            sound: "default",
          },
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

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
