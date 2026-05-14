-- CreateEnum
CREATE TYPE "workshop_status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "cohort_status" AS ENUM ('active', 'inactive', 'closed');

-- CreateEnum
CREATE TYPE "session_attendance_status" AS ENUM ('not_opened', 'open', 'closed');

-- CreateTable
CREATE TABLE "workshops" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "workshop_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL,
    "workshop_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "cohort_status" NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "meeting_no" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "attendance_status" "session_attendance_status" NOT NULL DEFAULT 'not_opened',
    "attendance_opened_at" TIMESTAMP(3),
    "attendance_opened_by" UUID,
    "attendance_closed_at" TIMESTAMP(3),
    "attendance_closed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshops_slug_key" ON "workshops"("slug");

-- CreateIndex
CREATE INDEX "workshops_status_idx" ON "workshops"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_slug_key" ON "cohorts"("slug");

-- CreateIndex
CREATE INDEX "cohorts_workshop_id_idx" ON "cohorts"("workshop_id");

-- CreateIndex
CREATE INDEX "cohorts_status_idx" ON "cohorts"("status");

-- CreateIndex
CREATE INDEX "sessions_cohort_id_idx" ON "sessions"("cohort_id");

-- CreateIndex
CREATE INDEX "sessions_attendance_status_idx" ON "sessions"("attendance_status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_cohort_id_meeting_no_key" ON "sessions"("cohort_id", "meeting_no");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_attendance_opened_by_fkey" FOREIGN KEY ("attendance_opened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_attendance_closed_by_fkey" FOREIGN KEY ("attendance_closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
