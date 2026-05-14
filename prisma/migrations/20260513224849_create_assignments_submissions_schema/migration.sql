-- CreateEnum
CREATE TYPE "assignment_category" AS ENUM ('regular', 'final_project');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('draft', 'published', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('submitted', 'late', 'reopened', 'graded', 'returned');

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "workshop_id" UUID NOT NULL,
    "session_id" UUID,
    "created_by_id" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "assignment_category" NOT NULL DEFAULT 'regular',
    "status" "assignment_status" NOT NULL DEFAULT 'draft',
    "due_at" TIMESTAMP(3),
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "allow_late" BOOLEAN NOT NULL DEFAULT false,
    "required_for_certificate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "attempt_no" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "status" "submission_status" NOT NULL DEFAULT 'submitted',
    "repository_url" TEXT,
    "deployment_url" TEXT,
    "content_text" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "graded_at" TIMESTAMP(3),
    "graded_by_id" UUID,
    "reopened_at" TIMESTAMP(3),
    "reopened_by_id" UUID,
    "reopen_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_files" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_workshop_id_idx" ON "assignments"("workshop_id");

-- CreateIndex
CREATE INDEX "assignments_session_id_idx" ON "assignments"("session_id");

-- CreateIndex
CREATE INDEX "assignments_category_idx" ON "assignments"("category");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE INDEX "assignments_due_at_idx" ON "assignments"("due_at");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_workshop_id_slug_key" ON "assignments"("workshop_id", "slug");

-- CreateIndex
CREATE INDEX "submissions_assignment_id_idx" ON "submissions"("assignment_id");

-- CreateIndex
CREATE INDEX "submissions_user_id_idx" ON "submissions"("user_id");

-- CreateIndex
CREATE INDEX "submissions_assignment_id_user_id_idx" ON "submissions"("assignment_id", "user_id");

-- CreateIndex
CREATE INDEX "submissions_assignment_id_user_id_is_latest_idx" ON "submissions"("assignment_id", "user_id", "is_latest");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignment_id_user_id_attempt_no_key" ON "submissions"("assignment_id", "user_id", "attempt_no");

-- CreateIndex
CREATE INDEX "submission_files_submission_id_idx" ON "submission_files"("submission_id");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_id_fkey" FOREIGN KEY ("graded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reopened_by_id_fkey" FOREIGN KEY ("reopened_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;