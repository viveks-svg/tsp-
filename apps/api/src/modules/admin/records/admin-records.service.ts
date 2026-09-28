import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ShopOrderStatus } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";

/**
 * Admin "see everything" views (Phase 1): clients, payments, bookings,
 * shop orders, consultations and reviews. Read-only apart from moving a
 * shop order through dispatch.
 *
 * Bookings are not linked to accounts — they carry the client's name, email
 * and phone — so a client's bookings are matched on email.
 */

export const PAGE_SIZE = 25;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const pageArgs = (page?: number) => {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  return { page: p, skip: (p - 1) * PAGE_SIZE, take: PAGE_SIZE };
};

const contains = (q?: string) => (q?.trim() ? { contains: q.trim(), mode: "insensitive" as const } : undefined);

/** A day boundary for "YYYY-MM-DD" in IST, as the UTC instant stored in the database. */
const istDayStart = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) - 330 * 60_000);

const todayIstMidnightUtc = () => {
  const ist = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  return new Date(`${ist}T00:00:00Z`); // Booking.scheduledDate is a calendar date stored at 00:00 UTC
};

export type PaymentSource = "BOOKING" | "WALLET" | "SHOP";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface PaymentRow {
  source: PaymentSource;
  id: string;
  name: string | null;
  email: string | null;
  label: string;
  amount: number;
  status: PaymentStatus;
  reference: string | null;
  at: Date;
}

/** Every payment attempt across the three money paths, normalised to one shape. */
const PAYMENTS_SQL = Prisma.sql`
  SELECT 'BOOKING' AS source, b.id, b."fullName" AS name, b.email, b."serviceName" AS label,
         b."totalAmountPaise" / 100.0 AS amount,
         CASE b.status WHEN 'PENDING_PAYMENT' THEN 'PENDING' WHEN 'CANCELLED' THEN 'CANCELLED'
                       WHEN 'REFUNDED' THEN 'REFUNDED' ELSE 'PAID' END AS status,
         COALESCE(b."razorpayPaymentId", b."razorpayOrderId") AS reference,
         COALESCE(b."confirmedAt", b."createdAt") AS at
    FROM "Booking" b
  UNION ALL
  SELECT 'WALLET', o.id, u.name, u.email, 'Wallet top-up', o.amount::float8,
         CASE WHEN o.status = 'SUCCESS' AND (
                     SELECT COALESCE(SUM(r.amount), 0) FROM "Refund" r
                       JOIN "PaymentTransaction" t ON t.id = r."transactionId"
                      WHERE t."orderId" = o.id AND r.status = 'SUCCESS') >= o.amount THEN 'REFUNDED'
              WHEN o.status = 'SUCCESS' THEN 'PAID' WHEN o.status = 'FAILED' THEN 'FAILED' ELSE 'PENDING' END,
         COALESCE((SELECT t."gatewayTransactionId" FROM "PaymentTransaction" t
                    WHERE t."orderId" = o.id AND t."gatewayTransactionId" IS NOT NULL
                    ORDER BY t."createdAt" DESC LIMIT 1), o."gatewayOrderId"),
         o."updatedAt"
    FROM "PaymentOrder" o JOIN "User" u ON u.id = o."userId"
  UNION ALL
  SELECT 'SHOP', s.id, s."customerName", s."customerEmail", 'Shop order', s."totalAmount"::float8,
         CASE WHEN s.status = 'CANCELLED' AND EXISTS (
                     SELECT 1 FROM "MoneyAction" m
                      WHERE m."targetId" = s.id AND m.type = 'REFUND_SHOP_ORDER' AND m.status = 'COMPLETED') THEN 'REFUNDED'
              WHEN s.status = 'PENDING' THEN 'PENDING' WHEN s.status = 'CANCELLED' THEN 'CANCELLED' ELSE 'PAID' END,
         COALESCE(s."paymentId", s."razorpayOrderId"),
         s."createdAt"
    FROM "ShopOrder" s
`;

export interface PaymentFilters {
  source?: string;
  status?: string;
  from?: string; // YYYY-MM-DD, IST
  to?: string; // YYYY-MM-DD, IST, inclusive
  q?: string;
}

/** Shop orders move forward through dispatch; they can be cancelled before they ship. */
const NEXT_SHOP_STATUS: Record<ShopOrderStatus, ShopOrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class AdminRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Clients ─────────────────────────────────────────────────────────────

  async listClients(q?: string, page?: number): Promise<Page<unknown>> {
    const { page: p, skip, take } = pageArgs(page);
    const search = contains(q);
    const where: Prisma.UserWhereInput = {
      role: "USER",
      ...(search && { OR: [{ name: search }, { email: search }, { phone: search }] }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          authProvider: true,
          createdAt: true,
          wallet: { select: { balance: true } },
          _count: { select: { consultations: true, shopOrders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Paid bookings per email (bookings are not linked to accounts).
    const emails = rows.map((r) => r.email).filter((e): e is string => !!e);
    const bookingTotals = emails.length
      ? await this.prisma.booking.groupBy({
          by: ["email"],
          where: { email: { in: emails, mode: "insensitive" }, status: { in: ["CONFIRMED", "COMPLETED"] } },
          _count: true,
          _sum: { totalAmountPaise: true },
        })
      : [];
    const byEmail = new Map(bookingTotals.map((b) => [b.email.toLowerCase(), b]));

    return {
      items: rows.map((r) => {
        const b = r.email ? byEmail.get(r.email.toLowerCase()) : undefined;
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          signedUpWith: r.authProvider,
          joinedAt: r.createdAt,
          walletBalance: Number(r.wallet?.balance ?? 0),
          consultations: r._count.consultations,
          shopOrders: r._count.shopOrders,
          bookings: b?._count ?? 0,
          bookingSpend: (b?._sum.totalAmountPaise ?? 0) / 100,
        };
      }),
      total,
      page: p,
      pageSize: PAGE_SIZE,
    };
  }

  async getClient(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        authProvider: true,
        createdAt: true,
        profile: { select: { dob: true, tob: true, pob: true, gender: true } },
        wallet: {
          select: {
            balance: true,
            ledgerEntries: {
              orderBy: { createdAt: "desc" },
              take: 50,
              select: { id: true, amount: true, type: true, description: true, balanceAfter: true, createdAt: true },
            },
          },
        },
        consultations: {
          orderBy: { scheduledAt: "desc" },
          take: 50,
          select: {
            id: true,
            type: true,
            status: true,
            scheduledAt: true,
            durationMin: true,
            cost: true,
            astrologer: { select: { user: { select: { name: true } } } },
            review: { select: { rating: true, review: true } },
          },
        },
        shopOrders: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, status: true, totalAmount: true, createdAt: true, _count: { select: { items: true } } },
        },
        sessions: {
          where: { isRevoked: false, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, deviceModel: true, os: true, userAgent: true, ipAddress: true, createdAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException("Client not found.");

    const bookings = user.email
      ? await this.prisma.booking.findMany({
          where: { email: { equals: user.email, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            serviceName: true,
            status: true,
            scheduledDate: true,
            scheduledSlot: true,
            totalAmountPaise: true,
            createdAt: true,
          },
        })
      : [];

    return {
      ...user,
      wallet: user.wallet
        ? {
            balance: Number(user.wallet.balance),
            entries: user.wallet.ledgerEntries.map((e) => ({ ...e, amount: Number(e.amount), balanceAfter: Number(e.balanceAfter) })),
          }
        : null,
      consultations: user.consultations.map((c) => ({
        ...c,
        cost: c.cost == null ? null : Number(c.cost),
        astrologerName: c.astrologer?.user.name ?? null,
        astrologer: undefined,
      })),
      shopOrders: user.shopOrders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount), items: o._count.items, _count: undefined })),
      bookings: bookings.map(({ totalAmountPaise, ...b }) => ({ ...b, amount: totalAmountPaise / 100 })),
    };
  }

  // ── Payments ────────────────────────────────────────────────────────────

  private paymentWhere(f: PaymentFilters) {
    const conds: Prisma.Sql[] = [];
    if (f.source && ["BOOKING", "WALLET", "SHOP"].includes(f.source)) conds.push(Prisma.sql`source = ${f.source}`);
    if (f.status && ["PAID", "PENDING", "FAILED", "CANCELLED", "REFUNDED"].includes(f.status)) {
      conds.push(Prisma.sql`status = ${f.status}`);
    }
    if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) conds.push(Prisma.sql`at >= ${istDayStart(f.from)}`);
    if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) {
      conds.push(Prisma.sql`at < ${new Date(istDayStart(f.to).getTime() + 86_400_000)}`);
    }
    if (f.q?.trim()) {
      const like = `%${f.q.trim()}%`;
      conds.push(Prisma.sql`(name ILIKE ${like} OR email ILIKE ${like} OR reference ILIKE ${like} OR label ILIKE ${like})`);
    }
    return conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.empty;
  }

  async listPayments(f: PaymentFilters, page?: number) {
    const { page: p, skip, take } = pageArgs(page);
    const where = this.paymentWhere(f);
    const [items, [totals]] = await Promise.all([
      this.prisma.$queryRaw<PaymentRow[]>`SELECT * FROM (${PAYMENTS_SQL}) x ${where} ORDER BY at DESC LIMIT ${take} OFFSET ${skip}`,
      this.prisma.$queryRaw<{ count: number; paid: number }[]>`
        SELECT COUNT(*)::int AS count, COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0)::float8 AS paid
          FROM (${PAYMENTS_SQL}) x ${where}`,
    ]);
    return {
      items: items.map((r) => ({ ...r, amount: Number(r.amount) })),
      total: totals.count,
      paidTotal: totals.paid,
      page: p,
      pageSize: PAGE_SIZE,
    };
  }

  async exportPaymentsCsv(f: PaymentFilters) {
    const rows = await this.prisma.$queryRaw<PaymentRow[]>`
      SELECT * FROM (${PAYMENTS_SQL}) x ${this.paymentWhere(f)} ORDER BY at DESC LIMIT 20000`;
    const ist = (d: Date) =>
      new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(d);
    const cell = (v: unknown) => {
      const s = v == null ? "" : String(v);
      // Quote, and neutralise spreadsheet formulas.
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const header = ["Date (IST)", "Through", "For", "Client", "Email", "Amount (INR)", "Status", "Reference"];
    const lines = rows.map((r) =>
      [ist(r.at), r.source, r.label, r.name, r.email, Number(r.amount).toFixed(2), r.status, r.reference].map(cell).join(","),
    );
    return [header.map(cell).join(","), ...lines].join("\r\n");
  }

  // ── Bookings ────────────────────────────────────────────────────────────

  async listBookings(view: string | undefined, q?: string, page?: number) {
    const { page: p, skip, take } = pageArgs(page);
    const today = todayIstMidnightUtc();
    const search = contains(q);
    const views: Record<string, { where: Prisma.BookingWhereInput; orderBy: Prisma.BookingOrderByWithRelationInput[] }> = {
      upcoming: {
        where: { status: "CONFIRMED", OR: [{ scheduledDate: { gte: today } }, { scheduledDate: null }] },
        orderBy: [{ scheduledDate: "asc" }, { scheduledSlot: "asc" }],
      },
      past: {
        where: { status: { in: ["CONFIRMED", "COMPLETED"] }, scheduledDate: { lt: today } },
        orderBy: [{ scheduledDate: "desc" }],
      },
      unpaid: { where: { status: "PENDING_PAYMENT" }, orderBy: [{ createdAt: "desc" }] },
      closed: { where: { status: { in: ["CANCELLED", "REFUNDED"] } }, orderBy: [{ updatedAt: "desc" }] },
    };
    const v = views[view ?? "upcoming"] ?? views.upcoming;
    const where: Prisma.BookingWhereInput = {
      AND: [v.where, ...(search ? [{ OR: [{ fullName: search }, { email: search }, { phone: search }, { serviceName: search }] }] : [])],
    };
    const [rows, total, counts] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: v.orderBy,
        skip,
        take,
        select: {
          id: true,
          serviceName: true,
          serviceCategory: true,
          fullName: true,
          email: true,
          phone: true,
          scheduledDate: true,
          scheduledSlot: true,
          totalAmountPaise: true,
          status: true,
          meetLink: true,
          createdAt: true,
        },
      }),
      this.prisma.booking.count({ where }),
      Promise.all(Object.entries(views).map(async ([k, x]) => [k, await this.prisma.booking.count({ where: x.where })] as const)),
    ]);
    return {
      items: rows.map(({ totalAmountPaise, ...b }) => ({ ...b, amount: totalAmountPaise / 100 })),
      total,
      counts: Object.fromEntries(counts),
      page: p,
      pageSize: PAGE_SIZE,
    };
  }

  async getBooking(id: string) {
    const b = await this.prisma.booking.findUnique({
      where: { id },
      include: { bookingLead: { select: { id: true, solutionName: true, status: true, createdAt: true } } },
    });
    if (!b) throw new NotFoundException("Booking not found.");
    const [events, account] = await Promise.all([
      this.prisma.paymentEvent.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: "asc" },
        select: { id: true, eventType: true, razorpayEventId: true, amountPaise: true, createdAt: true },
      }),
      this.prisma.user.findFirst({ where: { email: { equals: b.email, mode: "insensitive" } }, select: { id: true } }),
    ]);
    const { razorpaySignature: _signature, ...rest } = b;
    return {
      ...rest,
      baseAmount: b.baseAmountPaise / 100,
      surchargeAmount: b.surchargeAmountPaise / 100,
      amount: b.totalAmountPaise / 100,
      clientId: account?.id ?? null,
      paymentEvents: events.map((e) => ({ ...e, amount: e.amountPaise / 100 })),
    };
  }

  // ── Shop orders ─────────────────────────────────────────────────────────

  async listOrders(status: string | undefined, q?: string, page?: number) {
    const { page: p, skip, take } = pageArgs(page);
    const search = contains(q);
    const statusWhere: Prisma.ShopOrderWhereInput =
      status === "TO_DISPATCH"
        ? { status: { in: ["PAID", "PROCESSING"] } }
        : status && status in NEXT_SHOP_STATUS
          ? { status: status as ShopOrderStatus }
          : {};
    const where: Prisma.ShopOrderWhereInput = {
      AND: [statusWhere, ...(search ? [{ OR: [{ customerName: search }, { customerEmail: search }, { customerPhone: search }, { id: search }] }] : [])],
    };
    const [rows, total, toDispatch] = await Promise.all([
      this.prisma.shopOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          city: true,
          state: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: { select: { productName: true, quantity: true } },
        },
      }),
      this.prisma.shopOrder.count({ where }),
      this.prisma.shopOrder.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
    ]);
    return {
      items: rows.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
      total,
      toDispatch,
      page: p,
      pageSize: PAGE_SIZE,
    };
  }

  async getOrder(id: string) {
    const o = await this.prisma.shopOrder.findUnique({
      where: { id },
      include: { items: true, user: { select: { id: true, name: true } } },
    });
    if (!o) throw new NotFoundException("Order not found.");
    return {
      ...o,
      totalAmount: Number(o.totalAmount),
      items: o.items.map((i) => ({ ...i, price: Number(i.price) })),
      nextStatuses: NEXT_SHOP_STATUS[o.status],
    };
  }

  async updateOrderStatus(id: string, status: ShopOrderStatus) {
    const o = await this.prisma.shopOrder.findUnique({ where: { id }, select: { status: true } });
    if (!o) throw new NotFoundException("Order not found.");
    if (!NEXT_SHOP_STATUS[o.status].includes(status)) {
      throw new BadRequestException(`An order that is ${o.status.toLowerCase()} can't become ${status.toLowerCase()}.`);
    }
    await this.prisma.shopOrder.update({ where: { id }, data: { status } });
    return this.getOrder(id);
  }

  // ── Consultations & reviews ─────────────────────────────────────────────

  async listConsultations(status: string | undefined, type: string | undefined, page?: number) {
    const { page: p, skip, take } = pageArgs(page);
    const where: Prisma.ConsultationWhereInput = {
      ...(status && ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"].includes(status) && { status: status as never }),
      ...(type && ["CHAT", "CALL"].includes(type) && { type: type as never }),
    };
    const [rows, total, stats] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        orderBy: { scheduledAt: "desc" },
        skip,
        take,
        // Admins see who, when and how much — never the conversation itself.
        select: {
          id: true,
          type: true,
          status: true,
          scheduledAt: true,
          durationMin: true,
          cost: true,
          lockedPricingPerMin: true,
          campaignId: true,
          user: { select: { id: true, name: true, email: true } },
          astrologer: { select: { user: { select: { name: true } } } },
          callSession: { select: { durationSeconds: true, endReason: true } },
          review: { select: { rating: true, review: true } },
        },
      }),
      this.prisma.consultation.count({ where }),
      this.prisma.consultation.aggregate({ where: { status: "COMPLETED" }, _sum: { cost: true, durationMin: true }, _count: true }),
    ]);
    return {
      items: rows.map((c) => ({
        ...c,
        cost: c.cost == null ? null : Number(c.cost),
        lockedPricingPerMin: Number(c.lockedPricingPerMin),
        astrologerName: c.astrologer?.user.name ?? null,
        astrologer: undefined,
        viaLiveQueue: !!c.campaignId,
      })),
      total,
      completed: { count: stats._count, minutes: stats._sum.durationMin ?? 0, revenue: Number(stats._sum.cost ?? 0) },
      page: p,
      pageSize: PAGE_SIZE,
    };
  }

  async listReviews(page?: number) {
    const { page: p, skip, take } = pageArgs(page);
    const [rows, total, avg] = await Promise.all([
      this.prisma.consultationReview.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          rating: true,
          review: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
          astrologer: { select: { user: { select: { name: true } } } },
          consultation: { select: { type: true } },
        },
      }),
      this.prisma.consultationReview.count(),
      this.prisma.consultationReview.aggregate({ _avg: { rating: true } }),
    ]);
    return {
      items: rows.map((r) => ({ ...r, astrologerName: r.astrologer?.user.name ?? null, astrologer: undefined })),
      total,
      averageRating: avg._avg.rating,
      page: p,
      pageSize: PAGE_SIZE,
    };
  }
}

