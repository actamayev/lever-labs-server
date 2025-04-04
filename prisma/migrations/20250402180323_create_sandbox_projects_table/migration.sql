-- CreateTable
CREATE TABLE "sandbox_project" (
    "sandbox_project_id" SERIAL NOT NULL,
    "sandbox_xml" TEXT NOT NULL,
    "project_owner_id" INTEGER NOT NULL,
    "project_uuid" TEXT NOT NULL,
    "project_name" TEXT,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_project_pkey" PRIMARY KEY ("sandbox_project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_project_project_uuid_key" ON "sandbox_project"("project_uuid");

-- CreateIndex
CREATE INDEX "sandbox_project__project_owner_id_idx" ON "sandbox_project"("project_owner_id");

-- AddForeignKey
ALTER TABLE "sandbox_project" ADD CONSTRAINT "sandbox_project_project_owner_id_fkey" FOREIGN KEY ("project_owner_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
