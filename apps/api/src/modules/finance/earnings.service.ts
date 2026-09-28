import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { ScheduleService } from "../schedule/schedule.service";
import { FinanceSettingsService } from "./finance-settings.service";

/**
 * What the astrologer earns. Every credit to an astrologer's balance goes
 * through here so the platform commission (Settings → Finance) is applied once,
 * consistently. The balance is what TSP owes them; payouts debit it.
 */
@Injectable()
export class EarningsService {
  private readonly logger = new Logger(EarningsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly schedule: ScheduleService,
    private readonly settings: FinanceSettingsService,
  ) {}

  /** The astrologer's share of an amount the client paid, and the commission kept. */
  async split(amount: Prisma.Decimal | number) {
    const { commissionPercent } = await this.settings.getFinance();
    const gross = new Prisma.Decimal(amount);
    const commission = gross.mul(commissionPercent).div(100).toDecimalPlaces(2);
    return { gross, commission, share: gross.minus(commission), commissionPercent };
  }

  /** Credits a completed consultation to the astrologer, less commission. */
  async creditConsultation(
    tx: Prisma.TransactionClient,
    astrologerUserId: string,
    cost: Prisma.Decimal | number,
    consultationId: string,
    label: string,
  ) {
    const { share, commission, commissionPercent } = await this.split(cost);
    if (share.lte(0)) return;
    await this.wallet.creditWallet(
      tx,
      astrologerUserId,
      share,
      "CONSULTATION",
      `${label} — ₹${new Prisma.Decimal(cost).toFixed(2)} less ${commissionPercent}% commission (₹${commission.toFixed(2)})`,
      consultationId,
    );
  }

  /**
   * Credits a paid booking (a session with the astrologer taking bookings) to
   * that astrologer, once, if bookings count towards earnings.
   */
  async creditBooking(bookingId: string) {
    try {
      const [finance, provider, booking] = await Promise.all([
        this.settings.getFinance(),
        this.schedule.getProvider(),
        this.prisma.booking.findUnique({ where: { id: bookingId } }),
      ]);
      if (!finance.bookingEarnings || !provider || !booking || booking.status !== "CONFIRMED") return;

      const wallet = await this.prisma.wallet.findUnique({ where: { userId: provider.userId }, select: { id: true } });
      if (!wallet) return;
      const already = await this.prisma.walletLedgerEntry.findFirst({
        where: { walletId: wallet.id, purpose: "BOOKING", referenceId: bookingId },
        select: { id: true },
      });
      if (already) return;

      const { share, commission, commissionPercent } = await this.split(booking.totalAmountPaise / 100);
      if (share.lte(0)) return;
      await this.prisma.$transaction((tx) =>
        this.wallet.creditWallet(
          tx,
          provider.userId,
          share,
          "BOOKING",
          `${booking.serviceName} for ${booking.fullName} — ₹${(booking.totalAmountPaise / 100).toFixed(2)} less ${commissionPercent}% commission (₹${commission.toFixed(2)})`,
          bookingId,
        ),
      );
    } catch (e) {
      // Earnings must never break a client's payment confirmation.
      this.logger.error(`Could not credit booking ${bookingId} to the astrologer: ${(e as Error).message}`);
    }
  }

  /** When a booking is refunded, take back the matching part of the astrologer's share. */
  async reverseBooking(tx: Prisma.TransactionClient, bookingId: string, refundedAmount: number, totalAmount: number) {
    const credit = await tx.walletLedgerEntry.findFirst({
      where: { purpose: "BOOKING", referenceId: bookingId, type: "CREDIT" },
      include: { wallet: { select: { userId: true } } },
    });
    if (!credit || totalAmount <= 0) return;
    const portion = credit.amount.mul(refundedAmount).div(totalAmount).toDecimalPlaces(2);
    if (portion.lte(0)) return;
    await this.wallet.debitWallet(
      tx,
      credit.wallet.userId,
      portion,
      "BOOKING_REFUND",
      `Refund of booking — ₹${refundedAmount.toFixed(2)} returned to the client`,
      bookingId,
      true, // the astrologer may already have been paid; the balance can go below zero
    );
  }
}
