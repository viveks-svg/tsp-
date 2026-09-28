-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ANNOUNCEMENT';

-- CreateTable
CREATE TABLE "NotificationBroadcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "audience" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL,
    "pushSent" INTEGER NOT NULL,
    "pushFailed" INTEGER NOT NULL,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationBroadcast_createdAt_idx" ON "NotificationBroadcast"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationBroadcast" ADD CONSTRAINT "NotificationBroadcast_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
