-- CreateEnum
CREATE TYPE "material_type" AS ENUM ('text', 'link', 'video', 'document', 'file');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "workshop_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order_no" INTEGER NOT NULL DEFAULT 1,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "session_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "material_type" NOT NULL,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "order_no" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT,
    "url" TEXT,
    "file_url" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "modules_workshop_id_idx" ON "modules"("workshop_id");

-- CreateIndex
CREATE INDEX "modules_status_idx" ON "modules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "modules_workshop_id_slug_key" ON "modules"("workshop_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "modules_workshop_id_order_no_key" ON "modules"("workshop_id", "order_no");

-- CreateIndex
CREATE INDEX "materials_module_id_idx" ON "materials"("module_id");

-- CreateIndex
CREATE INDEX "materials_session_id_idx" ON "materials"("session_id");

-- CreateIndex
CREATE INDEX "materials_type_idx" ON "materials"("type");

-- CreateIndex
CREATE INDEX "materials_status_idx" ON "materials"("status");

-- CreateIndex
CREATE UNIQUE INDEX "materials_module_id_order_no_key" ON "materials"("module_id", "order_no");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
