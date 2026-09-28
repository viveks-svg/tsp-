import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { toCsv } from "../../../common/csv";

/**
 * Business reports for a date range (IST days, inclusive).
 *
 * Money in is counted when it is received; refunds when they go out — so a
 * booking paid in March and refunded in April shows in March's takings and
 * April's refunds, the way the bank statement reads.
 *
 *   Received  = paid bookings + successful wallet top-ups + paid shop orders
 *   Refunded  = refunds completed from the admin panel
 *   Net       = received − refunded
 *   Astrologer's share = what was credited to astrologers (after commission),
 *                        less booking reversals
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 3 * 366;
const DAY_MS = 86_400_000;

const istDayStart = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) - 330 * 60_000);
const ymd = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** Every payment received, one row each. */
const RECEIPTS_SQL = Prisma.sql`
  SELECT 'BOOKING' AS source, COALESCE(b."confirmedAt", b."createdAt") AS at, b."totalAmountPaise" / 100.0 AS amount,
         lower(b.email) AS who, b."fullName" AS name,
         (SELECT u.id FROM "User" u WHERE lower(u.email) = lower(b.email) LIMIT 1) AS "userId"
    FROM "Booking" b
   WHERE b.status IN ('CONFIRMED', 'COMPLETED', 'REFUNDED')
  UNION ALL
  SELECT 'WALLET', o."updatedAt", o.amount::float8, lower(COALESCE(u.email, u.id)), u.name, u.id
    FROM "PaymentOrder" o JOIN "User" u ON u.id = o."userId"
   WHERE o.status = 'SUCCESS'
  UNION ALL
  SELECT 'SHOP', s."createdAt", s."totalAmount"::float8, lower(s."customerEmail"), s."customerName",
         COALESCE(s."userId", (SELECT u.id FROM "User" u WHERE lower(u.email) = lower(s."customerEmail") LIMIT 1))
    FROM "ShopOrder" s
   WHERE s.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED') OR (s.status = 'CANCELLED' AND s."paymentId" IS NOT NULL)
`;

const REFUNDS_SQL = Prisma.sql`
  SELECT m."completedAt" AS at, m.amount::float8 AS amount, m.type::text AS type
    FROM "MoneyAction" m
   WHERE m.status = 'COMPLETED' AND m.type IN ('REFUND_BOOKING', 'REFUND_SHOP_ORDER', 'REFUND_WALLET_TOPUP')
`;

/** Movements on astrologers' balances: + earnings credited, − booking reversals. */
const SHARE_SQL = Prisma.sql`
  SELECT l."createdAt" AS at,
         CASE WHEN l.type = 'CREDIT' THEN l.amount::float8 ELSE -l.amount::float8 END AS amount
    FROM "WalletLedgerEntry" l
    JOIN "Wallet" w ON w.id = l."walletId"
    JOIN "User" u ON u.id = w."userId"
   WHERE u.role = 'ASTROLOGER'
     AND ((l.type = 'CREDIT' AND l.purpose IN ('CONSULTATION', 'BOOKING')) OR (l.type = 'DEBIT' AND l.purpose = 'BOOKING_REFUND'))
`;

const PAYOUTS_SQL = Prisma.sql`
  SELECT m."completedAt" AS at, m.amount::float8 AS amount
    FROM "MoneyAction" m
   WHERE m.status = 'COMPLETED' AND m.type = 'ASTROLOGER_PAYOUT'
`;

const month = (col: Prisma.Sql) => Prisma.sql`to_char(${col} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`;

export interface ReportRange {
  from: string;
  to: string;
}

export interface Totals {
  bookings: number;
  wallet: number;
  shop: number;
  received: number;
  refunded: number;
  net: number;
  astrologerShare: number;
  paidOut: number;
  payments: number;
}

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private range(r: Partial<ReportRange>) {
    if (!r.from || !r.to || !DATE_RE.test(r.from) || !DATE_RE.test(r.to)) {
      throw new BadRequestException("Choose a start and end date.");
    }
    const start = istDayStart(r.from);
    const end = new Date(istDayStart(r.to).getTime() + DAY_MS);
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    if (Number.isNaN(days) || days < 1) throw new BadRequestException("The end date must be on or after the start date.");
    if (days > MAX_DAYS) throw new BadRequestException("Reports cover up to three years at a time.");
    return { from: r.from, to: r.to, start, end, days };
  }

  private async totals(start: Date, end: Date): Promise<Totals> {
    const [[rec], [ref], [share], [paid]] = await Promise.all([
      this.prisma.$queryRaw<{ bookings: number; wallet: number; shop: number; payments: number }[]>`
        SELECT COALESCE(SUM(amount) FILTER (WHERE source = 'BOOKING'), 0)::float8 AS bookings,
               COALESCE(SUM(amount) FILTER (WHERE source = 'WALLET'), 0)::float8 AS wallet,
               COALESCE(SUM(amount) FILTER (WHERE source = 'SHOP'), 0)::float8 AS shop,
               COUNT(*)::int AS payments
          FROM (${RECEIPTS_SQL}) r WHERE at >= ${start} AND at < ${end}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0)::float8 AS total FROM (${REFUNDS_SQL}) r WHERE at >= ${start} AND at < ${end}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0)::float8 AS total FROM (${SHARE_SQL}) s WHERE at >= ${start} AND at < ${end}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0)::float8 AS total FROM (${PAYOUTS_SQL}) p WHERE at >= ${start} AND at < ${end}`,
    ]);
    const received = round(rec.bookings + rec.wallet + rec.shop);
    return {
      bookings: round(rec.bookings),
      wallet: round(rec.wallet),
      shop: round(rec.shop),
      received,
      refunded: round(ref.total),
      net: round(received - ref.total),
      astrologerShare: round(share.total),
      paidOut: round(paid.total),
      payments: rec.payments,
    };
  }

  private async monthly(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<{ month: string; kind: string; amount: number }[]>`
      SELECT ${month(Prisma.sql`at`)} AS month, source AS kind, SUM(amount)::float8 AS amount
        FROM (${RECEIPTS_SQL}) r WHERE at >= ${start} AND at < ${end} GROUP BY 1, 2
      UNION ALL
      SELECT ${month(Prisma.sql`at`)}, 'REFUND', SUM(amount)::float8 FROM (${REFUNDS_SQL}) r WHERE at >= ${start} AND at < ${end} GROUP BY 1
      UNION ALL
      SELECT ${month(Prisma.sql`at`)}, 'SHARE', SUM(amount)::float8 FROM (${SHARE_SQL}) s WHERE at >= ${start} AND at < ${end} GROUP BY 1
      UNION ALL
      SELECT ${month(Prisma.sql`at`)}, 'PAYOUT', SUM(amount)::float8 FROM (${PAYOUTS_SQL}) p WHERE at >= ${start} AND at < ${end} GROUP BY 1`;

    // Every month in the range, including quiet ones.
    const months: string[] = [];
    const first = ymd(start).slice(0, 7);
    const last = ymd(new Date(end.getTime() - 1)).slice(0, 7);
    for (let [y, m] = first.split("-").map(Number); `${y}-${String(m).padStart(2, "0")}` <= last; m === 12 ? ((m = 1), y++) : m++) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
    return months.map((key) => {
      const get = (kind: string) => round(rows.filter((r) => r.month === key && r.kind === kind).reduce((s, r) => s + Number(r.amount), 0));
      const bookings = get("BOOKING");
      const wallet = get("WALLET");
      const shop = get("SHOP");
      const refunded = get("REFUND");
      const received = round(bookings + wallet + shop);
      return { month: key, bookings, wallet, shop, received, refunded, net: round(received - refunded), astrologerShare: get("SHARE"), paidOut: get("PAYOUT") };
    });
  }

  async report(r: Partial<ReportRange>) {
    const { from, to, start, end, days } = this.range(r);
    const prevStart = new Date(start.getTime() - days * DAY_MS);

    const [totals, previous, months, services, consultations, clients, topClients, now] = await Promise.all([
      this.totals(start, end),
      this.totals(prevStart, start),
      this.monthly(start, end),
      this.prisma.$queryRaw<{ service: string; category: string; paid: number; refunded: number; amount: number }[]>`
        SELECT "serviceName" AS service, "serviceCategory"::text AS category,
               COUNT(*)::int AS paid,
               COUNT(*) FILTER (WHERE status = 'REFUNDED')::int AS refunded,
               SUM("totalAmountPaise")::float8 / 100 AS amount
          FROM "Booking"
         WHERE status IN ('CONFIRMED', 'COMPLETED', 'REFUNDED')
           AND COALESCE("confirmedAt", "createdAt") >= ${start} AND COALESCE("confirmedAt", "createdAt") < ${end}
         GROUP BY 1, 2 ORDER BY amount DESC`,
      this.prisma.$queryRaw<{ type: string; count: number; minutes: number; amount: number }[]>`
        SELECT type::text AS type, COUNT(*)::int AS count,
               COALESCE(SUM("durationMin"), 0)::int AS minutes, COALESCE(SUM(cost), 0)::float8 AS amount
          FROM "Consultation"
         WHERE status = 'COMPLETED' AND "updatedAt" >= ${start} AND "updatedAt" < ${end}
         GROUP BY 1 ORDER BY 1`,
      this.prisma.$queryRaw<{ newClients: number; paying: number; returning: number }[]>`
        WITH period AS (SELECT DISTINCT who FROM (${RECEIPTS_SQL}) r WHERE at >= ${start} AND at < ${end}),
             before AS (SELECT DISTINCT who FROM (${RECEIPTS_SQL}) r WHERE at < ${start})
        SELECT (SELECT COUNT(*) FROM "User" WHERE role = 'USER' AND "createdAt" >= ${start} AND "createdAt" < ${end})::int AS "newClients",
               (SELECT COUNT(*) FROM period)::int AS paying,
               (SELECT COUNT(*) FROM period p WHERE p.who IN (SELECT who FROM before))::int AS returning`,
      this.prisma.$queryRaw<{ name: string | null; email: string; userId: string | null; amount: number; payments: number }[]>`
        SELECT MAX(name) AS name, who AS email, MAX("userId") AS "userId", SUM(amount)::float8 AS amount, COUNT(*)::int AS payments
          FROM (${RECEIPTS_SQL}) r WHERE at >= ${start} AND at < ${end}
         GROUP BY who ORDER BY amount DESC LIMIT 10`,
      this.prisma.$queryRaw<{ clientWallets: number; astrologerOwed: number }[]>`
        SELECT COALESCE(SUM(w.balance) FILTER (WHERE u.role = 'USER'), 0)::float8 AS "clientWallets",
               COALESCE(SUM(w.balance) FILTER (WHERE u.role = 'ASTROLOGER'), 0)::float8 AS "astrologerOwed"
          FROM "Wallet" w JOIN "User" u ON u.id = w."userId"`,
    ]);

    return {
      range: { from, to, days, previousFrom: ymd(prevStart), previousTo: ymd(new Date(start.getTime() - 1)) },
      totals,
      previous,
      months,
      services: services.map((s) => ({ ...s, amount: round(s.amount) })),
      consultations: consultations.map((c) => ({ ...c, amount: round(c.amount) })),
      clients: clients[0],
      topClients: topClients.map((c) => ({ ...c, amount: round(c.amount) })),
      now: { clientWallets: round(now[0].clientWallets), astrologerOwed: round(now[0].astrologerOwed) },
    };
  }

  /** Month-by-month figures for the accountant. */
  async exportCsv(r: Partial<ReportRange>) {
    const { start, end } = this.range(r);
    const months = await this.monthly(start, end);
    const label = (m: string) =>
      new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));
    const n = (v: number) => v.toFixed(2);
    const rows = months.map((m) => [label(m.month), n(m.bookings), n(m.wallet), n(m.shop), n(m.received), n(m.refunded), n(m.net), n(m.astrologerShare), n(m.paidOut)]);
    const sum = (k: keyof (typeof months)[number]) => n(months.reduce((s, m) => s + Number(m[k]), 0));
    rows.push(["Total", sum("bookings"), sum("wallet"), sum("shop"), sum("received"), sum("refunded"), sum("net"), sum("astrologerShare"), sum("paidOut")]);
    return toCsv(
      ["Month", "Bookings (INR)", "Wallet top-ups (INR)", "Shop (INR)", "Received (INR)", "Refunded (INR)", "Net (INR)", "Astrologer's share (INR)", "Paid to astrologer (INR)"],
      rows,
    );
  }
}

const round = (n: number) => Math.round(Number(n || 0) * 100) / 100;
