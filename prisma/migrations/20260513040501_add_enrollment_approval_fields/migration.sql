-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "approved_by_id" UUID,
ADD COLUMN     "cohort_id" UUID,
ADD COLUMN     "rejected_by_id" UUID,
ADD COLUMN     "rejection_reason" TEXT;

-- CreateIndex
CREATE INDEX "enrollments_cohort_id_idx" ON "enrollments"("cohort_id");
