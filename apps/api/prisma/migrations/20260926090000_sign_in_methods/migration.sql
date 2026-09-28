-- Verified email / phone, email change, and two-step verification (authenticator app).
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifyTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifyExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "totpPendingSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "totpEnabledAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "totpLastStep" INTEGER;
ALTER TABLE "User" ADD COLUMN "totpRecoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
CREATE UNIQUE INDEX "User_emailVerifyTokenHash_key" ON "User"("emailVerifyTokenHash");

-- What we already know is verified:
--   Google / Apple sign-ins came with a provider-verified email;
--   staff joined through an emailed invite; phone sign-ins passed an SMS code.
UPDATE "User" SET "emailVerifiedAt" = "createdAt"
 WHERE "email" IS NOT NULL AND ("authProvider" IN ('GOOGLE', 'APPLE') OR "role" = 'ADMIN');
UPDATE "User" SET "phoneVerifiedAt" = "createdAt"
 WHERE "phone" IS NOT NULL AND "authProvider" = 'PHONE';
