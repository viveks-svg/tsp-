import { Prisma } from "@prisma/client";
import type { WalletService } from "./wallet.service";

/**
 * Charges a consultation to the client's wallet, capped at what the wallet
 * holds (a call that ran past the balance never pushes it below zero).
 * Returns the amount actually charged.
 */
export async function chargeUpTo(
  tx: Prisma.TransactionClient,
  wallet: WalletService,
  userId: string,
  due: Prisma.Decimal,
  consultationId: string,
  description: string,
) {
  const w = await tx.wallet.findUnique({ where: { userId }, select: { balance: true } });
  const balance = w?.balance ?? new Prisma.Decimal(0);
  const charged = Prisma.Decimal.max(0, Prisma.Decimal.min(due, balance));
  if (charged.gt(0)) {
    await wallet.debitWallet(tx, userId, charged, "CONSULTATION", description, consultationId);
  }
  return charged;
}
