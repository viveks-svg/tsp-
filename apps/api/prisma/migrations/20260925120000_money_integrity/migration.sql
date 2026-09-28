-- One Razorpay payment confirms at most one booking.
CREATE UNIQUE INDEX "Booking_razorpayPaymentId_key" ON "Booking"("razorpayPaymentId");

-- A booking or consultation credits the astrologer, and charges the client,
-- at most once — even if two requests race to complete it.
CREATE UNIQUE INDEX "WalletLedgerEntry_once_per_reference"
    ON "WalletLedgerEntry"("walletId", "purpose", "type", "referenceId")
    WHERE "purpose" IN ('BOOKING', 'CONSULTATION') AND "referenceId" IS NOT NULL;

-- Chats are billed by the server from when they started, not by a duration the client sends.
ALTER TABLE "Consultation" ADD COLUMN "startedAt" TIMESTAMP(3);
UPDATE "Consultation" SET "startedAt" = "updatedAt" WHERE "status" = 'ACTIVE';

-- Bookings made while signed in belong to that account ("My orders" no longer
-- relies on an unverified email to find them).
ALTER TABLE "Booking" ADD COLUMN "userId" TEXT;
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
