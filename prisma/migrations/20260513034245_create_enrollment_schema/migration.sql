-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "invitation_code_id" UUID,
    "scope" "invitation_scope" NOT NULL,
    "target_id" UUID NOT NULL,
    "status" "enrollment_status" NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE INDEX "enrollments_scope_target_id_idx" ON "enrollments"("scope", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_scope_target_id_key" ON "enrollments"("user_id", "scope", "target_id");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_invitation_code_id_fkey" FOREIGN KEY ("invitation_code_id") REFERENCES "invitation_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
