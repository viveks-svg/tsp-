-- AlterTable
ALTER TABLE "Blog" ADD COLUMN "excerpt" TEXT,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'vedic',
ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "byline" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Blog_published_publishedAt_idx" ON "Blog"("published", "publishedAt");
