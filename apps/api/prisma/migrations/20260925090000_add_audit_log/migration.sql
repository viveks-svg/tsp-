-- Activity log: every change made from the admin and astrologer panels.
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorEmail" TEXT,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "changes" JSONB,
    "details" JSONB,
    "outcome" TEXT NOT NULL DEFAULT 'SUCCESS',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_area_createdAt_idx" ON "AuditLog"("area", "createdAt");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
