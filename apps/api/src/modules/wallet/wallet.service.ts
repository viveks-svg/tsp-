import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletLedgerService } from "./ledger.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: WalletLedgerService,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found for user");
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const ledgerEntries = await this.prisma.walletLedgerEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      balance: wallet.balance,
      transactions,
      ledgerEntries,
    };
  }

  // Credit wallet within a transaction and record to ledger
  async creditWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: Prisma.Decimal | number,
    purpose: string,
    description: string,
    referenceId?: string | null,
  ) {
    const decimalAmount = new Prisma.Decimal(amount);
    if (decimalAmount.lte(0)) throw new BadRequestException("Amount must be positive");

    // Atomic increment: concurrent credits and debits can't overwrite each other.
    const found = await tx.wallet.updateMany({ where: { userId }, data: { balance: { increment: decimalAmount } } });
    if (found.count === 0) throw new NotFoundException("Wallet not found for user");
    const updated = await tx.wallet.findUniqueOrThrow({ where: { userId } });
    const newBalance = updated.balance;

    // Record immutable ledger entry
    await this.ledgerService.recordEntry(
      tx,
      updated.id,
      decimalAmount,
      "CREDIT",
      newBalance,
      purpose,
      description,
      referenceId,
    );

    // Backward-compatibility write to WalletTransaction
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: decimalAmount,
        type: "CREDIT",
        status: "SUCCESS",
        description,
      },
    });

    return updated;
  }

  // Debit wallet within a transaction and record to ledger
  async debitWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: Prisma.Decimal | number,
    purpose: string,
    description: string,
    referenceId?: string | null,
    allowNegative = false,
  ) {
    const decimalAmount = new Prisma.Decimal(amount);
    if (decimalAmount.lte(0)) throw new BadRequestException("Amount must be positive");

    // Atomic, conditional decrement: the balance check and the debit are one
    // statement, so two debits at once can't both spend the same money.
    const debited = await tx.wallet.updateMany({
      where: allowNegative ? { userId } : { userId, balance: { gte: decimalAmount } },
      data: { balance: { decrement: decimalAmount } },
    });
    if (debited.count === 0) {
      const exists = await tx.wallet.findUnique({ where: { userId }, select: { id: true } });
      if (!exists) throw new NotFoundException("Wallet not found for user");
      throw new BadRequestException("Insufficient wallet balance");
    }
    const updated = await tx.wallet.findUniqueOrThrow({ where: { userId } });
    const newBalance = updated.balance;

    // Record immutable ledger entry
    await this.ledgerService.recordEntry(
      tx,
      updated.id,
      decimalAmount,
      "DEBIT",
      newBalance,
      purpose,
      description,
      referenceId,
    );

    // Backward-compatibility write to WalletTransaction
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: decimalAmount,
        type: "DEBIT",
        status: "SUCCESS",
        description,
      },
    });

    return updated;
  }

}

