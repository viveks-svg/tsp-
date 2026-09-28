import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MoneyAction, MoneyActionStatus, MoneyActionType, Prisma, StaffRole } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { RazorpayService } from "../payments/razorpay.service";
import { can, type Permission } from "../../common/permissions";
import { EarningsService } from "./earnings.service";
import { FinanceSettingsService } from "./finance-settings.service";

/**
 * Refunds, wallet adjustments and astrologer payouts from the admin panel.
 *
 * Rule: a super admin's request is carried out at once. Anyone else's is
 * carried out at once up to the manager approval limit (Settings → Finance);
 * above it, it waits for a super admin to approve or reject. Every request is
 * kept, with who asked, who approved, why, and the Razorpay/bank reference.
 */

export interface Actor {
  id: string;
  role: string;
  staffRole: StaffRole | null;
}

export interface MoneyRequest {
  type: MoneyActionType;
  amount: number;
  reason: string;
  targetId?: string;
  userId?: string;
  reference?: string;
}

const PERMISSION_FOR: Record<MoneyActionType, Permission> = {
  REFUND_BOOKING: "payments.refund",
  REFUND_SHOP_ORDER: "payments.refund",
  REFUND_WALLET_TOPUP: "payments.refund",
  WALLET_CREDIT: "wallet.adjust",
  WALLET_DEBIT: "wallet.adjust",
  ASTROLOGER_PAYOUT: "payouts.manage",
};

const REFUNDS: MoneyActionType[] = ["REFUND_BOOKING", "REFUND_SHOP_ORDER", "REFUND_WALLET_TOPUP"];
const OPEN: MoneyActionStatus[] = ["PENDING_APPROVAL", "COMPLETED"];

const rupees = (d: Prisma.Decimal | number) => Number(new Prisma.Decimal(d).toFixed(2));

@Injectable()
export class MoneyActionsService {
  private readonly logger = new Logger(MoneyActionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly razorpay: RazorpayService,
    private readonly earnings: EarningsService,
    private readonly settings: FinanceSettingsService,
  ) {}

  // ── Requesting ────────────────────────────────────────────────────────────

  async request(actor: Actor, input: MoneyRequest) {
    if (!can(actor.role, actor.staffRole, PERMISSION_FOR[input.type])) {
      throw new ForbiddenException("Your role doesn't include this kind of money action.");
    }
    const amount = Math.round(Number(input.amount) * 100) / 100;
    if (!(amount > 0)) throw new BadRequestException("The amount must be more than ₹0.");
    const reason = input.reason?.trim();
    if (!reason || reason.length < 3) throw new BadRequestException("Give a short reason — it is kept on record.");

    const subject = await this.validate({ ...input, amount });

    const { managerApprovalLimit } = await this.settings.getFinance();
    // The limit covers what a manager moves for one client or one order in a day,
    // so a large amount can't be split into several small ones to skip approval.
    const recent =
      actor.staffRole === "SUPER_ADMIN"
        ? 0
        : await this.selfApprovedRecently(actor.id, { targetId: input.targetId ?? null, userId: subject.userId });
    const needsApproval = actor.staffRole !== "SUPER_ADMIN" && amount + recent > managerApprovalLimit;

    const action = await this.prisma.moneyAction.create({
      data: {
        type: input.type,
        // Every request starts waiting; within the requester's authority it is carried out below.
        status: "PENDING_APPROVAL",
        amount,
        reason,
        targetId: input.targetId ?? null,
        userId: subject.userId,
        reference: input.reference?.trim() || null,
        requestedById: actor.id,
        // Within the requester's authority: approved by the requester, carried out now.
        ...(needsApproval ? {} : { reviewedById: actor.id, reviewedAt: new Date(), reviewNote: "Within the requester's limit" }),
      },
    });

    if (needsApproval) {
      return { ...(await this.describe(action.id)), outcome: "PENDING_APPROVAL" as const, limit: managerApprovalLimit };
    }
    return { ...(await this.carryOut(action)), outcome: "DONE" as const };
  }

  /**
   * Checks the request is possible and returns whose money it is. `selfId` is
   * the request being carried out, so it doesn't count against itself.
   */
  private async validate(input: MoneyRequest & { amount: number }, selfId?: string): Promise<{ userId: string | null }> {
    switch (input.type) {
      case "REFUND_BOOKING": {
        const b = await this.prisma.booking.findUnique({ where: { id: input.targetId ?? "" } });
        if (!b) throw new NotFoundException("Booking not found.");
        if (!["CONFIRMED", "COMPLETED", "REFUNDED"].includes(b.status) || !b.razorpayPaymentId) {
          throw new BadRequestException("Only paid bookings can be refunded.");
        }
        await this.assertRefundable(input.targetId!, b.totalAmountPaise / 100, input.amount, selfId);
        const client = await this.prisma.user.findFirst({ where: { email: { equals: b.email, mode: "insensitive" } }, select: { id: true } });
        return { userId: client?.id ?? null };
      }
      case "REFUND_SHOP_ORDER": {
        const o = await this.prisma.shopOrder.findUnique({ where: { id: input.targetId ?? "" } });
        if (!o) throw new NotFoundException("Order not found.");
        if (o.status === "PENDING" || !o.paymentId) throw new BadRequestException("Only paid orders can be refunded.");
        await this.assertRefundable(input.targetId!, rupees(o.totalAmount), input.amount, selfId);
        return { userId: o.userId };
      }
      case "REFUND_WALLET_TOPUP": {
        const order = await this.prisma.paymentOrder.findUnique({
          where: { id: input.targetId ?? "" },
          include: { transactions: { where: { status: "SUCCESS" }, include: { refunds: true } } },
        });
        const txn = order?.transactions[0];
        if (!order || order.status !== "SUCCESS" || !txn?.gatewayTransactionId) {
          throw new BadRequestException("Only completed wallet top-ups can be refunded.");
        }
        await this.assertRefundable(input.targetId!, rupees(order.amount), input.amount, selfId);
        const w = await this.prisma.wallet.findUnique({ where: { userId: order.userId } });
        if (!w || w.balance.lt(input.amount)) {
          throw new BadRequestException(
            `The client's wallet holds ${w ? `₹${w.balance.toFixed(2)}` : "nothing"} — they have spent part of this top-up.`,
          );
        }
        return { userId: order.userId };
      }
      case "WALLET_CREDIT":
      case "WALLET_DEBIT": {
        const u = await this.prisma.user.findFirst({ where: { id: input.userId ?? "", role: "USER" }, include: { wallet: true } });
        if (!u?.wallet) throw new NotFoundException("Client wallet not found.");
        if (input.type === "WALLET_DEBIT" && u.wallet.balance.lt(input.amount)) {
          throw new BadRequestException(`The wallet holds only ₹${u.wallet.balance.toFixed(2)}.`);
        }
        return { userId: u.id };
      }
      case "ASTROLOGER_PAYOUT": {
        const a = await this.prisma.astrologer.findFirst({ where: { userId: input.userId ?? "" }, include: { user: { include: { wallet: true } } } });
        if (!a?.user.wallet) throw new NotFoundException("Astrologer not found.");
        if (!input.reference?.trim()) throw new BadRequestException("Enter the bank transfer reference (UTR).");
        const pending = await this.pendingTotal({ type: "ASTROLOGER_PAYOUT", userId: a.userId, ...(selfId && { id: { not: selfId } }) });
        if (a.user.wallet.balance.minus(pending).lt(input.amount)) {
          throw new BadRequestException(`Only ₹${a.user.wallet.balance.minus(pending).toFixed(2)} is owed to this astrologer.`);
        }
        return { userId: a.userId };
      }
    }
  }

  /** Refunds (done and waiting) can't exceed what was paid. */
  private async assertRefundable(targetId: string, paid: number, amount: number, selfId?: string) {
    const already = await this.prisma.moneyAction.aggregate({
      where: { targetId, type: { in: REFUNDS }, status: { in: OPEN }, ...(selfId && { id: { not: selfId } }) },
      _sum: { amount: true },
    });
    const left = paid - rupees(already._sum.amount ?? 0);
    if (amount > left + 0.001) {
      throw new BadRequestException(left > 0 ? `At most ₹${left.toFixed(2)} can still be refunded.` : "This has already been fully refunded.");
    }
  }

  private async pendingTotal(where: Prisma.MoneyActionWhereInput) {
    const r = await this.prisma.moneyAction.aggregate({ where: { ...where, status: "PENDING_APPROVAL" }, _sum: { amount: true } });
    return r._sum.amount ?? new Prisma.Decimal(0);
  }

  // ── Reviewing ─────────────────────────────────────────────────────────────

  async approve(actor: Actor, id: string, note?: string) {
    this.assertApprover(actor);
    const action = await this.claim(id, actor.id, note);
    return this.carryOut(action);
  }

  async reject(actor: Actor, id: string, note?: string) {
    this.assertApprover(actor);
    const { count } = await this.prisma.moneyAction.updateMany({
      where: { id, status: "PENDING_APPROVAL", reviewedAt: null },
      data: { status: "REJECTED", reviewedById: actor.id, reviewedAt: new Date(), reviewNote: note?.trim() || null },
    });
    if (!count) throw new BadRequestException("This request is no longer waiting for approval.");
    return this.describe(id);
  }

  private assertApprover(actor: Actor) {
    if (!can(actor.role, actor.staffRole, "money.approve")) throw new ForbiddenException("Only a Super Admin can approve.");
  }

  /** Marks a waiting request as being approved; only one approver can win. */
  private async claim(id: string, reviewerId: string, note?: string) {
    const { count } = await this.prisma.moneyAction.updateMany({
      where: { id, status: "PENDING_APPROVAL", reviewedAt: null },
      data: { reviewedById: reviewerId, reviewedAt: new Date(), reviewNote: note?.trim() || null },
    });
    if (!count) throw new BadRequestException("This request is no longer waiting for approval.");
    return this.prisma.moneyAction.findUniqueOrThrow({ where: { id } });
  }

  /** What this person has moved on their own authority for the same client / order in the last 24 hours. */
  async selfApprovedRecently(actorId: string, subject: { targetId: string | null; userId: string | null }) {
    const same: Prisma.MoneyActionWhereInput[] = [];
    if (subject.targetId) same.push({ targetId: subject.targetId });
    if (subject.userId) same.push({ userId: subject.userId });
    if (!same.length) return 0;
    const r = await this.prisma.moneyAction.aggregate({
      where: {
        requestedById: actorId,
        reviewedById: actorId,
        status: { in: ["COMPLETED", "PENDING_APPROVAL"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        OR: same,
      },
      _sum: { amount: true },
    });
    return rupees(r._sum.amount ?? 0);
  }

  // ── Carrying out ──────────────────────────────────────────────────────────

  private async carryOut(action: MoneyAction) {
    try {
      // Re-check against the state now (balances and refunds may have changed while it waited).
      await this.revalidate(action);
      const reference = await this.execute(action);
      await this.prisma.moneyAction.update({
        where: { id: action.id },
        data: { status: "COMPLETED", completedAt: new Date(), reference: reference ?? action.reference },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Money action ${action.id} (${action.type}) failed: ${message}`);
      await this.prisma.moneyAction.update({ where: { id: action.id }, data: { status: "FAILED", error: message } });
    }
    return this.describe(action.id);
  }

  private async revalidate(action: MoneyAction) {
    await this.validate(
      {
        type: action.type,
        amount: rupees(action.amount),
        reason: action.reason,
        targetId: action.targetId ?? undefined,
        userId: action.userId ?? undefined,
        reference: action.reference ?? undefined,
      },
      action.id,
    );
  }

  /** Does the thing. Returns the gateway/bank reference to keep. */
  private async execute(a: MoneyAction): Promise<string | null> {
    const amount = rupees(a.amount);
    const paise = Math.round(amount * 100);
    const notes = { reason: a.reason.slice(0, 250), tsp_action: a.id };

    switch (a.type) {
      case "REFUND_BOOKING": {
        const b = await this.prisma.booking.findUniqueOrThrow({ where: { id: a.targetId! } });
        const refund = await this.gatewayRefund(b.razorpayPaymentId!, paise, notes);
        const refundedSoFar = await this.refundedTotal(b.id, a.id);
        const total = b.totalAmountPaise / 100;
        await this.prisma.$transaction(async (tx) => {
          if (refundedSoFar + amount >= total - 0.001) {
            await tx.booking.update({ where: { id: b.id }, data: { status: "REFUNDED" } });
          }
          await tx.paymentEvent.create({
            data: { bookingId: b.id, eventType: "REFUND_COMPLETED", razorpayEventId: refund, amountPaise: paise },
          });
          await this.earnings.reverseBooking(tx, b.id, amount, total);
        });
        return refund;
      }
      case "REFUND_SHOP_ORDER": {
        const o = await this.prisma.shopOrder.findUniqueOrThrow({ where: { id: a.targetId! } });
        const refund = await this.gatewayRefund(o.paymentId!, paise, notes);
        const refundedSoFar = await this.refundedTotal(o.id, a.id);
        if (refundedSoFar + amount >= rupees(o.totalAmount) - 0.001) {
          await this.prisma.shopOrder.update({ where: { id: o.id }, data: { status: "CANCELLED" } });
        }
        return refund;
      }
      case "REFUND_WALLET_TOPUP": {
        const order = await this.prisma.paymentOrder.findUniqueOrThrow({
          where: { id: a.targetId! },
          include: { transactions: { where: { status: "SUCCESS" } } },
        });
        const txn = order.transactions[0];
        // Take it out of the wallet first (atomically, only if it's still there),
        // so the balance can't be spent while the refund is on its way out.
        await this.prisma.$transaction((tx) =>
          this.wallet.debitWallet(tx, order.userId, amount, "REFUND", `Top-up refunded to the original payment method — ${a.reason}`, a.id),
        );
        let refund: string;
        try {
          refund = await this.gatewayRefund(txn.gatewayTransactionId!, paise, notes);
        } catch (e) {
          await this.prisma.$transaction((tx) =>
            this.wallet.creditWallet(tx, order.userId, amount, "ADJUSTMENT", "Top-up refund did not go through — returned to the wallet", a.id),
          );
          throw e;
        }
        await this.prisma.refund.create({
          data: { transactionId: txn.id, amount, status: "SUCCESS", gatewayRefundId: refund, reason: a.reason },
        });
        return refund;
      }
      case "WALLET_CREDIT":
        await this.prisma.$transaction((tx) =>
          this.wallet.creditWallet(tx, a.userId!, amount, "ADJUSTMENT", `Credit from the TSP office — ${a.reason}`, a.id),
        );
        return null;
      case "WALLET_DEBIT":
        await this.prisma.$transaction((tx) =>
          this.wallet.debitWallet(tx, a.userId!, amount, "ADJUSTMENT", `Debit by the TSP office — ${a.reason}`, a.id),
        );
        return null;
      case "ASTROLOGER_PAYOUT":
        await this.prisma.$transaction((tx) =>
          this.wallet.debitWallet(tx, a.userId!, amount, "PAYOUT", `Bank transfer ${a.reference} — ${a.reason}`, a.id),
        );
        return a.reference;
    }
  }

  private async refundedTotal(targetId: string, excludeId: string) {
    const r = await this.prisma.moneyAction.aggregate({
      where: { targetId, type: { in: REFUNDS }, status: "COMPLETED", id: { not: excludeId } },
      _sum: { amount: true },
    });
    return rupees(r._sum.amount ?? 0);
  }

  private async gatewayRefund(paymentId: string, paise: number, notes: Record<string, string>) {
    if (!(await this.razorpay.isConfigured())) {
      if (process.env.NODE_ENV === "production") throw new Error("Online payments are not configured.");
      return `rfnd_mock_${randomUUID().slice(0, 12)}`; // local testing only
    }
    const refund = await this.razorpay.refund(paymentId, paise, notes);
    return refund.id;
  }

  // ── Reading ───────────────────────────────────────────────────────────────

  async list(filters: { status?: string; type?: string; targetId?: string; userId?: string }, page = 1) {
    const where: Prisma.MoneyActionWhereInput = {
      ...(filters.status && filters.status in MoneyActionStatus && { status: filters.status as MoneyActionStatus }),
      // "Awaiting approval" excludes actions already approved by their requester and being carried out.
      ...(filters.status === "PENDING_APPROVAL" && { reviewedAt: null }),
      ...(filters.type && filters.type in MoneyActionType && { type: filters.type as MoneyActionType }),
      ...(filters.targetId && { targetId: filters.targetId }),
      ...(filters.userId && { userId: filters.userId }),
    };
    const p = Math.max(1, Math.floor(page) || 1);
    const [items, total, pending] = await Promise.all([
      this.prisma.moneyAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * 25,
        take: 25,
        include: SUMMARY_INCLUDE,
      }),
      this.prisma.moneyAction.count({ where }),
      this.prisma.moneyAction.count({ where: { status: "PENDING_APPROVAL", reviewedAt: null } }),
    ]);
    return { items: items.map(toSummary), total, pendingApproval: pending, page: p, pageSize: 25 };
  }

  private async describe(id: string) {
    return toSummary(await this.prisma.moneyAction.findUniqueOrThrow({ where: { id }, include: SUMMARY_INCLUDE }));
  }

  /** What each astrologer is owed (their balance) and what has been paid out. */
  async payoutBalances() {
    const astrologers = await this.prisma.astrologer.findMany({
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true, wallet: { select: { id: true, balance: true } } } } },
    });
    return Promise.all(
      astrologers.map(async (a) => {
        const walletId = a.user.wallet?.id;
        const [paid, earned, last, pending] = await Promise.all([
          this.prisma.moneyAction.aggregate({ where: { userId: a.userId, type: "ASTROLOGER_PAYOUT", status: "COMPLETED" }, _sum: { amount: true } }),
          walletId
            ? this.prisma.walletLedgerEntry.aggregate({
                where: { walletId, type: "CREDIT", purpose: { in: ["CONSULTATION", "BOOKING"] } },
                _sum: { amount: true },
              })
            : null,
          this.prisma.moneyAction.findFirst({
            where: { userId: a.userId, type: "ASTROLOGER_PAYOUT", status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            select: { amount: true, completedAt: true, reference: true },
          }),
          this.pendingTotal({ type: "ASTROLOGER_PAYOUT", userId: a.userId }),
        ]);
        return {
          astrologerId: a.id,
          userId: a.userId,
          name: a.user.name,
          email: a.user.email,
          active: a.status === "APPROVED",
          owed: rupees(a.user.wallet?.balance ?? 0),
          awaitingApproval: rupees(pending),
          earned: rupees(earned?._sum.amount ?? 0),
          paidOut: rupees(paid._sum.amount ?? 0),
          lastPayout: last ? { amount: rupees(last.amount), at: last.completedAt, reference: last.reference } : null,
        };
      }),
    );
  }
}

const SUMMARY_INCLUDE = {
  user: { select: { id: true, name: true, email: true, role: true } },
  requestedBy: { select: { name: true, email: true } },
  reviewedBy: { select: { name: true, email: true } },
} as const;

const toSummary = (a: Prisma.MoneyActionGetPayload<{ include: typeof SUMMARY_INCLUDE }>) => ({
  id: a.id,
  type: a.type,
  status: a.status,
  amount: rupees(a.amount),
  reason: a.reason,
  targetId: a.targetId,
  reference: a.reference,
  error: a.error,
  user: a.user,
  requestedBy: a.requestedBy.name || a.requestedBy.email,
  reviewedBy: a.reviewedBy ? a.reviewedBy.name || a.reviewedBy.email : null,
  reviewNote: a.reviewNote,
  createdAt: a.createdAt,
  reviewedAt: a.reviewedAt,
  completedAt: a.completedAt,
});
