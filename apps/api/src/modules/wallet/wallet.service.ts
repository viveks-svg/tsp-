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
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found for user");
    }

    const decimalAmount = new Prisma.Decimal(amount);
    const newBalance = wallet.balance.plus(decimalAmount);

    const updated = await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });

    // Record immutable ledger entry
    await this.ledgerService.recordEntry(
      tx,
      wallet.id,
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
  ) {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found for user");
    }

    const decimalAmount = new Prisma.Decimal(amount);
    if (wallet.balance.lessThan(decimalAmount)) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    const newBalance = wallet.balance.minus(decimalAmount);

    const updated = await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });

    // Record immutable ledger entry
    await this.ledgerService.recordEntry(
      tx,
      wallet.id,
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

  // Helper method to add funds for testing
  async addFunds(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found for user");
    }

    return this.prisma.$transaction(async (tx) => {
      const decimalAmount = new Prisma.Decimal(amount);
      const newBalance = wallet.balance.plus(decimalAmount);

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: newBalance },
      });

      // Record immutable ledger entry
      await this.ledgerService.recordEntry(
        tx,
        wallet.id,
        decimalAmount,
        "CREDIT",
        newBalance,
        "TOPUP",
        "Top-up funds (Development/Testing)",
      );

      // Backward-compatibility write to WalletTransaction
      await tx.walletTransaction.create({
        data: {
          userId,
          amount: decimalAmount,
          type: "CREDIT",
          status: "SUCCESS",
          description: "Top-up funds (Development/Testing)",
        },
      });

      return updatedWallet;
    });
  }
}

