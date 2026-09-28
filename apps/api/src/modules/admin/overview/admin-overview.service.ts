import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

/**
 * Admin overview — the numbers behind the /admin home page.
 *
 * Money received comes from three places:
 *   - Booking       (Dr. Pradeep's sessions, vastu, reports) — CONFIRMED/COMPLETED, amount in paise
 *   - PaymentOrder  (wallet top-ups through Razorpay)        — SUCCESS
 *   - ShopOrder     (products)                                — PAID onwards
 *
 * Timestamps are stored in UTC; "today" and "this month" are Indian Standard Time.
 * Booking.scheduledDate is a calendar date stored at 00:00 UTC, so it is compared as-is.
 */

const IST = "Asia/Kolkata";
const PAID_BOOKING = `('CONFIRMED','COMPLETED')`;
const PAID_SHOP = `('PAID','PROCESSING','SHIPPED','DELIVERED')`;

/** SQL expression converting a UTC timestamp column to an IST calendar date. */
const istDate = (col: string) => `((${col} AT TIME ZONE 'UTC') AT TIME ZONE '${IST}')::date`;

/** Every rupee received, one row per payment, with its IST date. */
const RECEIPTS_SQL = `
  SELECT 'BOOKING' AS source, b.id, b."fullName" AS name, b."serviceName" AS label,
         b."totalAmountPaise" / 100.0 AS amount, COALESCE(b."confirmedAt", b."createdAt") AS at
    FROM "Booking" b WHERE b.status IN ${PAID_BOOKING}
  UNION ALL
  SELECT 'WALLET', o.id, COALESCE(u.name, u.email, u.phone), 'Wallet top-up',
         o.amount::float8, o."updatedAt"
    FROM "PaymentOrder" o JOIN "User" u ON u.id = o."userId" WHERE o.status = 'SUCCESS'
  UNION ALL
  SELECT 'SHOP', s.id, s."customerName", 'Shop order',
         s."totalAmount"::float8, s."createdAt"
    FROM "ShopOrder" s WHERE s.status IN ${PAID_SHOP}
`;

type Source = "BOOKING" | "WALLET" | "SHOP";

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [revenue, trend, recentPayments, clients, upcoming, attention] = await Promise.all([
      this.revenue(),
      this.trend(30),
      this.recentPayments(8),
      this.clients(),
      this.upcomingAppointments(6),
      this.attention(),
    ]);

    return { generatedAt: new Date().toISOString(), revenue, trend, recentPayments, clients, upcoming, attention };
  }

  private async revenue() {
    const rows = await this.prisma.$queryRawUnsafe<
      { source: Source; today: number; month: number; last_month: number; lifetime: number }[]
    >(`
      WITH r AS (SELECT source, amount, ${istDate("at")} AS d FROM (${RECEIPTS_SQL}) x),
           t AS (SELECT (now() AT TIME ZONE '${IST}')::date AS today)
      SELECT source,
             COALESCE(SUM(amount) FILTER (WHERE d = t.today), 0)::float8 AS today,
             COALESCE(SUM(amount) FILTER (WHERE d >= date_trunc('month', t.today)), 0)::float8 AS month,
             COALESCE(SUM(amount) FILTER (WHERE d >= date_trunc('month', t.today) - interval '1 month'
                                            AND d <  date_trunc('month', t.today)), 0)::float8 AS last_month,
             COALESCE(SUM(amount), 0)::float8 AS lifetime
        FROM r, t GROUP BY source
    `);

    const bySource = { BOOKING: 0, WALLET: 0, SHOP: 0 } as Record<Source, number>;
    const total = { today: 0, month: 0, lastMonth: 0, lifetime: 0 };
    for (const row of rows) {
      bySource[row.source] = row.month;
      total.today += row.today;
      total.month += row.month;
      total.lastMonth += row.last_month;
      total.lifetime += row.lifetime;
    }
    return { ...total, monthBySource: bySource };
  }

  /** Daily receipts for the last `days` IST days, zero-filled, split by source. */
  private async trend(days: number) {
    const rows = await this.prisma.$queryRawUnsafe<
      { day: string; booking: number; wallet: number; shop: number }[]
    >(`
      WITH r AS (SELECT source, amount, ${istDate("at")} AS d FROM (${RECEIPTS_SQL}) x),
           days AS (
             SELECT generate_series((now() AT TIME ZONE '${IST}')::date - ${days - 1},
                                    (now() AT TIME ZONE '${IST}')::date, interval '1 day')::date AS day
           )
      SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
             COALESCE(SUM(r.amount) FILTER (WHERE r.source = 'BOOKING'), 0)::float8 AS booking,
             COALESCE(SUM(r.amount) FILTER (WHERE r.source = 'WALLET'), 0)::float8 AS wallet,
             COALESCE(SUM(r.amount) FILTER (WHERE r.source = 'SHOP'), 0)::float8 AS shop
        FROM days LEFT JOIN r ON r.d = days.day
       GROUP BY days.day ORDER BY days.day
    `);
    return rows;
  }

  private async recentPayments(limit: number) {
    return this.prisma.$queryRawUnsafe<
      { source: Source; id: string; name: string | null; label: string; amount: number; at: Date }[]
    >(`SELECT * FROM (${RECEIPTS_SQL}) x ORDER BY at DESC LIMIT ${Number(limit)}`);
  }

  private async clients() {
    const [row] = await this.prisma.$queryRawUnsafe<{ total: number; this_month: number; last_month: number }[]>(`
      WITH t AS (SELECT date_trunc('month', (now() AT TIME ZONE '${IST}')::date) AS m)
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE ${istDate('"createdAt"')} >= t.m)::int AS this_month,
             COUNT(*) FILTER (WHERE ${istDate('"createdAt"')} >= t.m - interval '1 month'
                                AND ${istDate('"createdAt"')} <  t.m)::int AS last_month
        FROM "User", t WHERE role = 'USER'
    `);
    return { total: row.total, newThisMonth: row.this_month, newLastMonth: row.last_month };
  }

  /** Confirmed sessions from today (IST) onwards — Dr. Pradeep's diary. */
  private async upcomingAppointments(limit: number) {
    const todayIst = this.todayIst();
    const where = { status: "CONFIRMED" as const, scheduledDate: { gte: todayIst } };
    const [items, count] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [{ scheduledDate: "asc" }, { scheduledSlot: "asc" }],
        take: limit,
        select: {
          id: true, fullName: true, serviceName: true, serviceCategory: true,
          scheduledDate: true, scheduledSlot: true, meetLink: true, totalAmountPaise: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      count,
      items: items.map(({ totalAmountPaise, ...b }) => ({ ...b, amount: totalAmountPaise / 100 })),
    };
  }

  /** Things waiting on someone at TSP. */
  private async attention() {
    const [openLeads, unpaidCheckouts, shopToFulfil, liveConsultations, moneyAwaitingApproval] = await Promise.all([
      this.prisma.bookingLead.count({ where: { status: { not: "CONVERTED" }, phone: { not: null } } }),
      this.prisma.booking.count({
        where: { status: "PENDING_PAYMENT", createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      }),
      this.prisma.shopOrder.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      this.prisma.consultation.count({ where: { status: "ACTIVE" } }),
      this.prisma.moneyAction.count({ where: { status: "PENDING_APPROVAL", reviewedAt: null } }),
    ]);
    return { openLeads, unpaidCheckouts, shopToFulfil, liveConsultations, moneyAwaitingApproval };
  }

  /** Today's IST calendar date as a UTC-midnight Date, matching how scheduledDate is stored. */
  private todayIst(): Date {
    const istNow = new Date(Date.now() + 330 * 60_000);
    return new Date(`${istNow.toISOString().slice(0, 10)}T00:00:00.000Z`);
  }
}
