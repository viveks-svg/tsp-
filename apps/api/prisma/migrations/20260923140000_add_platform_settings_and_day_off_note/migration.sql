-- AlterTable
ALTER TABLE "SlotConfig" ADD COLUMN IF NOT EXISTS "note" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);
