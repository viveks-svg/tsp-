-- CreateEnum
CREATE TYPE "MoneyActionType" AS ENUM ('REFUND_BOOKING', 'REFUND_SHOP_ORDER', 'REFUND_WALLET_TOPUP', 'WALLET_CREDIT', 'WALLET_DEBIT', 'ASTROLOGER_PAYOUT');

-- CreateEnum
CREATE TYPE "MoneyActionStatus" AS ENUM ('PENDING_APPROVAL', 'COMPLETED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "MoneyAction" (
    "id" TEXT NOT NULL,
    "type" "MoneyActionType" NOT NULL,
    "status" "MoneyActionStatus" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "targetId" TEXT,
    "userId" TEXT,
    "reference" TEXT,
    "error" TEXT,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoneyAction_status_createdAt_idx" ON "MoneyAction"("status", "createdAt");
CREATE INDEX "MoneyAction_targetId_idx" ON "MoneyAction"("targetId");
CREATE INDEX "MoneyAction_userId_idx" ON "MoneyAction"("userId");

-- AddForeignKey
ALTER TABLE "MoneyAction" ADD CONSTRAINT "MoneyAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MoneyAction" ADD CONSTRAINT "MoneyAction_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoneyAction" ADD CONSTRAINT "MoneyAction_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
