-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "corrected_at" TIMESTAMP(3),
ADD COLUMN     "corrected_by_id" UUID;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_corrected_by_id_fkey" FOREIGN KEY ("corrected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
