import { ForbiddenException, Injectable } from "@nestjs/common";
import { parseSlotLabel } from "../schedule/slot-label";
import { PrismaService } from "../../database/prisma.service";
import { ScheduleService } from "../schedule/schedule.service";
import { nowInIst } from "../schedule/slot-label";

/**
 * Data for the astrologer's own panel. Every method starts from the signed-in
 * user's astrologer profile, so an astrologer only ever sees their own work.
 */
@Injectable()
export class AstrologerPanelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedule: ScheduleService,
  ) {}

  private async me(userId: string) {
    const astrologer = await this.prisma.astrologer.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
    if (!astrologer) throw new ForbiddenException("No astrologer profile for this login.");
    return astrologer;
  }

  /** Is this astrologer the one whose hours clients book and who takes the live queue? */
  private async isProvider(astrologerId: string) {
    return (await this.schedule.getProvider())?.astrologerId === astrologerId;
  }

  async overview(userId: string) {
    const me = await this.me(userId);
    const provider = await this.isProvider(me.id);
    const today = new Date(`${nowInIst().date}T00:00:00Z`);
    const monthStart = new Date(`${nowInIst().date.slice(0, 8)}01T00:00:00Z`);

    const [counts, upcoming, waiting, wallet, live] = await Promise.all([
      this.prisma.consultation.groupBy({ by: ["status"], where: { astrologerId: me.id }, _count: true }),
      // Booked sessions (vastu, consultations, reports) are with the platform's astrologer.
      provider
        ? this.prisma.booking.findMany({
            where: { status: "CONFIRMED", scheduledDate: { gte: today } },
            orderBy: [{ scheduledDate: "asc" }],
            take: 40, // sorted by actual time below (labels like "01:00 PM" don't sort as text)
            select: {
              id: true,
              fullName: true,
              serviceName: true,
              scheduledDate: true,
              scheduledSlot: true,
              meetLink: true,
              notes: true,
            },
          })
        : Promise.resolve([]),
      provider
        ? this.prisma.queueEntry.count({ where: { status: "WAITING", campaign: { isActive: true } } })
        : Promise.resolve(0),
      this.prisma.wallet.findUnique({ where: { userId }, select: { id: true, balance: true } }),
      provider ? this.schedule.getLiveStatus() : Promise.resolve({ isLive: false, nextWindow: null }),
    ]);

    const monthEarnings = wallet
      ? await this.prisma.walletLedgerEntry.aggregate({
          where: { walletId: wallet.id, type: "CREDIT", purpose: { in: ["CONSULTATION", "BOOKING"] }, createdAt: { gte: monthStart } },
          _sum: { amount: true },
        })
      : null;

    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
    return {
      profile: {
        name: me.user.name,
        email: me.user.email,
        bio: me.bio,
        pricingPerMin: Number(me.pricingPerMin),
        isAvailable: me.isAvailable,
        rating: me.rating,
      },
      isProvider: provider,
      live,
      consultations: {
        pending: byStatus.PENDING ?? 0,
        active: byStatus.ACTIVE ?? 0,
        completed: byStatus.COMPLETED ?? 0,
      },
      queueWaiting: waiting,
      upcoming: [...upcoming]
        .sort(
          (x, y) =>
            (x.scheduledDate?.getTime() ?? 0) - (y.scheduledDate?.getTime() ?? 0) ||
            (parseSlotLabel(x.scheduledSlot)?.start ?? 0) - (parseSlotLabel(y.scheduledSlot)?.start ?? 0),
        )
        .slice(0, 8)
        .map((b) => ({ ...b, scheduledDate: b.scheduledDate?.toISOString() ?? null })),
      earnings: {
        balance: Number(wallet?.balance ?? 0),
        thisMonth: Number(monthEarnings?._sum.amount ?? 0),
      },
    };
  }

  /** The consultation hours set by the TSP office (read-only for the astrologer). */
  async hours(userId: string) {
    const me = await this.me(userId);
    if (!(await this.isProvider(me.id))) return { isProvider: false as const, isAvailable: me.isAvailable };
    const [settings, weekly, daysOff] = await Promise.all([
      this.schedule.getSettings(),
      this.schedule.getWeekly(),
      this.schedule.listDaysOff(),
    ]);
    return { isProvider: true as const, isAvailable: me.isAvailable, settings, weekly, daysOff };
  }

  async earnings(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId }, select: { id: true, balance: true } });
    if (!wallet) return { balance: 0, lifetime: 0, entries: [] };
    const [entries, lifetime] = await Promise.all([
      this.prisma.walletLedgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, amount: true, type: true, purpose: true, description: true, balanceAfter: true, createdAt: true },
      }),
      this.prisma.walletLedgerEntry.aggregate({
        where: { walletId: wallet.id, type: "CREDIT", purpose: { in: ["CONSULTATION", "BOOKING"] } },
        _sum: { amount: true },
      }),
    ]);
    return {
      balance: Number(wallet.balance),
      lifetime: Number(lifetime._sum.amount ?? 0),
      entries: entries.map((e) => ({ ...e, amount: Number(e.amount), balanceAfter: Number(e.balanceAfter) })),
    };
  }
}
