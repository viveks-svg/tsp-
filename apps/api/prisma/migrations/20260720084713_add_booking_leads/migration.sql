-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('STARTED', 'CONTACT_CAPTURED', 'DETAILS_COMPLETED', 'PRICE_REVEALED', 'PAYMENT_INITIATED', 'CONVERTED');

-- CreateTable
CREATE TABLE "BookingLead" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "solutionSlug" TEXT NOT NULL,
    "solutionName" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "formData" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'STARTED',
    "consentToContact" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedBookingId" TEXT,

    CONSTRAINT "BookingLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingLeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingLeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingLead_sessionId_key" ON "BookingLead"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingLead_convertedBookingId_key" ON "BookingLead"("convertedBookingId");

-- CreateIndex
CREATE INDEX "BookingLead_status_lastActivityAt_idx" ON "BookingLead"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "BookingLead_phone_idx" ON "BookingLead"("phone");

-- CreateIndex
CREATE INDEX "BookingLeadEvent_leadId_idx" ON "BookingLeadEvent"("leadId");

-- AddForeignKey
ALTER TABLE "BookingLead" ADD CONSTRAINT "BookingLead_convertedBookingId_fkey" FOREIGN KEY ("convertedBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLeadEvent" ADD CONSTRAINT "BookingLeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "BookingLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
