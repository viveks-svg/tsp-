import { SAFE_LINK, SAFE_LINK_MESSAGE } from "../../common/safe-link";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FirebaseService } from "../firebase/firebase.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";

export type Audience = "ALL_CLIENTS" | "RECENT_CLIENTS" | "ME";

const FCM_BATCH = 500;

/**
 * Announcements from the admin panel: an in-app notification for every
 * recipient (the bell on the website) plus a push to their registered devices.
 * "ME" sends only to the sender, to preview how it looks.
 */
@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private audienceWhere(audience: Audience, senderId: string): Prisma.UserWhereInput {
    switch (audience) {
      case "ME":
        return { id: senderId };
      case "RECENT_CLIENTS":
        return { role: "USER", createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } };
      default:
        return { role: "USER" };
    }
  }

  async audienceSize(senderId: string) {
    const [all, recent, withDevices] = await Promise.all([
      this.prisma.user.count({ where: this.audienceWhere("ALL_CLIENTS", senderId) }),
      this.prisma.user.count({ where: this.audienceWhere("RECENT_CLIENTS", senderId) }),
      this.prisma.user.count({ where: { role: "USER", fcmTokens: { isEmpty: false } } }),
    ]);
    return { ALL_CLIENTS: all, RECENT_CLIENTS: recent, withDevices };
  }

  async send(senderId: string, input: { title: string; body: string; link?: string; audience: Audience }) {
    const title = input.title.trim();
    const body = input.body.trim();
    const link = input.link?.trim() || null;
    if (link && !SAFE_LINK.test(link)) throw new BadRequestException(SAFE_LINK_MESSAGE);

    const users = await this.prisma.user.findMany({
      where: this.audienceWhere(input.audience, senderId),
      select: { id: true, fcmTokens: true },
    });
    if (users.length === 0) throw new BadRequestException("Nobody is in this audience yet.");

    // In-app notifications (the bell), then live delivery to anyone on the site now.
    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type: "ANNOUNCEMENT" as const, title, body, metadata: { link } })),
    });
    for (const u of users) {
      this.realtime.emitNotificationToUser(u.id, { type: "ANNOUNCEMENT", title, body, metadata: { link }, isRead: false, createdAt: new Date() });
    }

    const { sent, failed } = await this.push(users, title, body, link);

    const record = await this.prisma.notificationBroadcast.create({
      data: {
        title,
        body,
        link,
        audience: input.audience,
        recipients: users.length,
        pushSent: sent,
        pushFailed: failed,
        sentById: senderId,
      },
    });
    return record;
  }

  /** Multicast in batches; tokens Firebase reports as dead are removed. */
  private async push(users: { id: string; fcmTokens: string[] }[], title: string, body: string, link: string | null) {
    const owners = new Map<string, string>();
    for (const u of users) for (const t of u.fcmTokens) owners.set(t, u.id);
    const tokens = [...owners.keys()];
    let sent = 0;
    let failed = 0;
    const dead: string[] = [];

    for (let i = 0; i < tokens.length; i += FCM_BATCH) {
      const batch = tokens.slice(i, i + FCM_BATCH);
      try {
        const res = await this.firebase.getMessaging().sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: { type: "ANNOUNCEMENT", ...(link && { link }) },
          android: { priority: "high", notification: { channelId: "default", sound: "default" } },
          webpush: { fcmOptions: { link: link?.startsWith("/") ? link : link || "/" } },
        });
        sent += res.successCount;
        failed += res.failureCount;
        res.responses.forEach((r, idx) => {
          const code = r.error?.code ?? "";
          if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) dead.push(batch[idx]);
        });
      } catch (e) {
        failed += batch.length;
        this.logger.error(`Push batch failed: ${(e as Error).message}`);
      }
    }

    if (dead.length) {
      const byUser = new Map<string, string[]>();
      for (const t of dead) byUser.set(owners.get(t)!, [...(byUser.get(owners.get(t)!) ?? []), t]);
      for (const [userId, gone] of byUser) {
        const u = users.find((x) => x.id === userId)!;
        await this.prisma.user.update({ where: { id: userId }, data: { fcmTokens: u.fcmTokens.filter((t) => !gone.includes(t)) } });
      }
    }
    return { sent, failed };
  }

  async history(page = 1) {
    const p = Math.max(1, Math.floor(page) || 1);
    const [items, total] = await Promise.all([
      this.prisma.notificationBroadcast.findMany({
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * 25,
        take: 25,
        include: { sentBy: { select: { name: true, email: true } } },
      }),
      this.prisma.notificationBroadcast.count(),
    ]);
    return {
      items: items.map(({ sentBy, ...b }) => ({ ...b, sentBy: sentBy.name || sentBy.email })),
      total,
      page: p,
      pageSize: 25,
    };
  }
}
