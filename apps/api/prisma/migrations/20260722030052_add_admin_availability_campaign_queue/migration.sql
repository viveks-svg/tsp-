-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'CALLING', 'IN_CALL', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "adminProviderId" TEXT,
ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "meetLink" TEXT,
ALTER COLUMN "astrologerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AdminAvailability" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bannerText" TEXT NOT NULL,
    "ratePerMinute" DECIMAL(10,2) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "position" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "consultationId" TEXT,

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAvailability_adminId_dayOfWeek_idx" ON "AdminAvailability"("adminId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "QueueEntry_campaignId_status_position_idx" ON "QueueEntry"("campaignId", "status", "position");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_adminProviderId_fkey" FOREIGN KEY ("adminProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAvailability" ADD CONSTRAINT "AdminAvailability_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
