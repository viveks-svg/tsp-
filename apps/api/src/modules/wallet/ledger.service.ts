import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Injectable()
export class WalletLedgerService {
  /**
   * Records an immutable ledger entry.
   * This must always be run within an existing Prisma transaction context.
   */
  async recordEntry(
    tx: Prisma.TransactionClient,
    walletId: string,
    amount: Prisma.Decimal | number,
    type: "CREDIT" | "DEBIT",
    balanceAfter: Prisma.Decimal,
    purpose: string,
    description: string,
    referenceId?: string | null,
  ) {
    return tx.walletLedgerEntry.create({
      data: {
        walletId,
        amount,
        type,
        balanceAfter,
        purpose,
        description,
        referenceId: referenceId || null,
      },
    });
  }
}
