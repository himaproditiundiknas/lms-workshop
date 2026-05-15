-- CreateEnum
CREATE TYPE "project_group_status" AS ENUM ('active', 'locked', 'archived');

-- CreateEnum
CREATE TYPE "project_group_member_role" AS ENUM ('leader', 'member');

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "project_group_id" UUID;

-- CreateTable
CREATE TABLE "project_groups" (
    "id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "created_by_id" UUID,
    "mentor_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "project_group_status" NOT NULL DEFAULT 'active',
    "repository_url" TEXT,
    "deployment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_group_members" (
    "id" UUID NOT NULL,
    "project_group_id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "project_group_member_role" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_groups_cohort_id_idx" ON "project_groups"("cohort_id");

-- CreateIndex
CREATE INDEX "project_groups_created_by_id_idx" ON "project_groups"("created_by_id");

-- CreateIndex
CREATE INDEX "project_groups_mentor_id_idx" ON "project_groups"("mentor_id");

-- CreateIndex
CREATE INDEX "project_groups_status_idx" ON "project_groups"("status");

-- CreateIndex
CREATE UNIQUE INDEX "project_groups_cohort_id_slug_key" ON "project_groups"("cohort_id", "slug");

-- CreateIndex
CREATE INDEX "project_group_members_project_group_id_idx" ON "project_group_members"("project_group_id");

-- CreateIndex
CREATE INDEX "project_group_members_cohort_id_idx" ON "project_group_members"("cohort_id");

-- CreateIndex
CREATE INDEX "project_group_members_user_id_idx" ON "project_group_members"("user_id");

-- CreateIndex
CREATE INDEX "project_group_members_role_idx" ON "project_group_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "project_group_members_project_group_id_user_id_key" ON "project_group_members"("project_group_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_group_members_cohort_id_user_id_key" ON "project_group_members"("cohort_id", "user_id");

-- CreateIndex
CREATE INDEX "submissions_project_group_id_idx" ON "submissions"("project_group_id");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_project_group_id_fkey" FOREIGN KEY ("project_group_id") REFERENCES "project_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_groups" ADD CONSTRAINT "project_groups_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_groups" ADD CONSTRAINT "project_groups_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_groups" ADD CONSTRAINT "project_groups_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_group_members" ADD CONSTRAINT "project_group_members_project_group_id_fkey" FOREIGN KEY ("project_group_id") REFERENCES "project_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_group_members" ADD CONSTRAINT "project_group_members_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_group_members" ADD CONSTRAINT "project_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
