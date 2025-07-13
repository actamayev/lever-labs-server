/*
  Warnings:

  - You are about to drop the column `profile_picture_id` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `teacher_id` on the `credentials` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_profile_picture_id_fkey";

-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_teacher_id_fkey";

-- DropIndex
DROP INDEX "credentials__profile_picture_id_idx";

-- DropIndex
DROP INDEX "credentials__teacher_id_idx";

-- DropIndex
DROP INDEX "credentials_profile_picture_id_key";

-- DropIndex
DROP INDEX "credentials_teacher_id_key";

-- AlterTable
ALTER TABLE "credentials" DROP COLUMN "profile_picture_id",
DROP COLUMN "teacher_id";

-- AddForeignKey
ALTER TABLE "profile_picture" ADD CONSTRAINT "profile_picture_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
