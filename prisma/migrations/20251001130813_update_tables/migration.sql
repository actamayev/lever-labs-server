/*
  Warnings:

  - You are about to drop the column `completed_at` on the `lesson_user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `is_completed` on the `lesson_user_progress` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."lesson_user_progress_user_id_lesson_id_key";

-- AlterTable
ALTER TABLE "public"."lesson_user_progress" DROP COLUMN "completed_at",
DROP COLUMN "is_completed";
