-- AlterTable
ALTER TABLE "ConsultationReview" ADD COLUMN     "adminProviderId" TEXT,
ALTER COLUMN "astrologerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ConsultationReview" ADD CONSTRAINT "ConsultationReview_adminProviderId_fkey" FOREIGN KEY ("adminProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
