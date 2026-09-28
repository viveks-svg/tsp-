-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_resetToken_key" ON "User"("resetToken");
