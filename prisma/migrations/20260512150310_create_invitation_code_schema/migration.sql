-- CreateEnum
CREATE TYPE "invitation_scope" AS ENUM ('workshop', 'cohort');

-- CreateEnum
CREATE TYPE "invitation_code_status" AS ENUM ('active', 'inactive', 'expired', 'revoked');

-- CreateTable
CREATE TABLE "invitation_codes" (
    "id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "scope" "invitation_scope" NOT NULL,
    "target_id" UUID NOT NULL,
    "status" "invitation_code_status" NOT NULL DEFAULT 'active',
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_redemptions" (
    "id" UUID NOT NULL,
    "invitation_code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_codes_code_hash_key" ON "invitation_codes"("code_hash");

-- CreateIndex
CREATE INDEX "invitation_codes_scope_target_id_idx" ON "invitation_codes"("scope", "target_id");

-- CreateIndex
CREATE INDEX "invitation_codes_status_idx" ON "invitation_codes"("status");

-- CreateIndex
CREATE INDEX "invitation_codes_expires_at_idx" ON "invitation_codes"("expires_at");

-- CreateIndex
CREATE INDEX "invitation_redemptions_user_id_idx" ON "invitation_redemptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_redemptions_invitation_code_id_user_id_key" ON "invitation_redemptions"("invitation_code_id", "user_id");

-- AddForeignKey
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_redemptions" ADD CONSTRAINT "invitation_redemptions_invitation_code_id_fkey" FOREIGN KEY ("invitation_code_id") REFERENCES "invitation_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_redemptions" ADD CONSTRAINT "invitation_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
