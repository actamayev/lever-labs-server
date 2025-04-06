/*
  Warnings:

  - A unique constraint covering the columns `[profile_picture_id]` on the table `credentials` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "name" TEXT,
ADD COLUMN     "profile_picture_id" INTEGER;

-- CreateTable
CREATE TABLE "profile_picture" (
    "profile_picture_id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_picture_pkey" PRIMARY KEY ("profile_picture_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_picture_user_id_key" ON "profile_picture"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_profile_picture_id_key" ON "credentials"("profile_picture_id");

-- CreateIndex
CREATE INDEX "credentials__profile_picture_id_idx" ON "credentials"("profile_picture_id");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_profile_picture_id_fkey" FOREIGN KEY ("profile_picture_id") REFERENCES "profile_picture"("profile_picture_id") ON DELETE SET NULL ON UPDATE CASCADE;
