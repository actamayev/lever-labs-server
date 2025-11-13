-- CreateTable
CREATE TABLE "sandbox_project_shares" (
    "sandbox_project_shares_id" SERIAL NOT NULL,
    "project_uuid" TEXT NOT NULL,
    "user_id_shared_with" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_project_shares_pkey" PRIMARY KEY ("sandbox_project_shares_id")
);

-- CreateIndex
CREATE INDEX "sandbox_project_shares_user_id_shared_with_idx" ON "sandbox_project_shares"("user_id_shared_with");

-- CreateIndex
CREATE INDEX "sandbox_project_shares_project_uuid_idx" ON "sandbox_project_shares"("project_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_project_shares_project_uuid_user_id_shared_with_key" ON "sandbox_project_shares"("project_uuid", "user_id_shared_with");

-- AddForeignKey
ALTER TABLE "sandbox_project_shares" ADD CONSTRAINT "sandbox_project_shares_project_uuid_fkey" FOREIGN KEY ("project_uuid") REFERENCES "sandbox_project"("project_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_project_shares" ADD CONSTRAINT "sandbox_project_shares_user_id_shared_with_fkey" FOREIGN KEY ("user_id_shared_with") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
