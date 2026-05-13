-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "nim" TEXT,
ADD COLUMN     "profile_completed_at" TIMESTAMP(3),
ADD COLUMN     "program_study" TEXT,
ADD COLUMN     "semester" INTEGER;
