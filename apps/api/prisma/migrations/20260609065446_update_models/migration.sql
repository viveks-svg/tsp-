/*
  Warnings:

  - Added the required column `lockedPricingPerMin` to the `Consultation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AstrologerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Astrologer" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "AstrologerStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "lockedPricingPerMin" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "consultationId" TEXT;

-- AddForeignKey
ALTER TABLE "Astrologer" ADD CONSTRAINT "Astrologer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
