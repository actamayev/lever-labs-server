/*
  Warnings:

  - The primary key for the `activity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `activity_uuid` on the `activity` table. All the data in the column will be lost.
  - The primary key for the `lesson` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `lesson_uuid` on the `lesson` table. All the data in the column will be lost.
  - The primary key for the `reading_question` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `reading_question_uuid` on the `reading_question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."completed_user_lesson" DROP CONSTRAINT "completed_user_lesson_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."lesson_question_map" DROP CONSTRAINT "lesson_question_map_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_block" DROP CONSTRAINT "reading_block_reading_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_question" DROP CONSTRAINT "reading_question_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_question_answer_choice" DROP CONSTRAINT "reading_question_answer_choice_reading_question_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_activity_progress" DROP CONSTRAINT "user_activity_progress_activity_id_fkey";

-- DropIndex
DROP INDEX "public"."activity__activity_uuid_idx";

-- DropIndex
DROP INDEX "public"."activity_activity_uuid_key";

-- DropIndex
DROP INDEX "public"."lesson_lesson_uuid_key";

-- DropIndex
DROP INDEX "public"."reading_question_reading_question_uuid_key";

-- AlterTable
ALTER TABLE "public"."activity" DROP CONSTRAINT "activity_pkey",
DROP COLUMN "activity_uuid",
ALTER COLUMN "activity_id" DROP DEFAULT,
ALTER COLUMN "activity_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "activity_pkey" PRIMARY KEY ("activity_id");
DROP SEQUENCE "activity_activity_id_seq";

-- AlterTable
ALTER TABLE "public"."completed_user_lesson" ALTER COLUMN "lesson_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."lesson" DROP CONSTRAINT "lesson_pkey",
DROP COLUMN "lesson_uuid",
ADD COLUMN     "lesson_description" TEXT,
ALTER COLUMN "lesson_id" DROP DEFAULT,
ALTER COLUMN "lesson_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "lesson_pkey" PRIMARY KEY ("lesson_id");
DROP SEQUENCE "lesson_lesson_id_seq";

-- AlterTable
ALTER TABLE "public"."lesson_question_map" ALTER COLUMN "lesson_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."reading_block" ALTER COLUMN "reading_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."reading_question" DROP CONSTRAINT "reading_question_pkey",
DROP COLUMN "reading_question_uuid",
ALTER COLUMN "reading_question_id" DROP DEFAULT,
ALTER COLUMN "reading_question_id" SET DATA TYPE TEXT,
ALTER COLUMN "activity_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "reading_question_pkey" PRIMARY KEY ("reading_question_id");
DROP SEQUENCE "reading_question_reading_question_id_seq";

-- AlterTable
ALTER TABLE "public"."reading_question_answer_choice" ALTER COLUMN "reading_question_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."user_activity_progress" ALTER COLUMN "activity_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."user_activity_progress" ADD CONSTRAINT "user_activity_progress_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_block" ADD CONSTRAINT "reading_block_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "public"."activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_question" ADD CONSTRAINT "reading_question_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_question_answer_choice" ADD CONSTRAINT "reading_question_answer_choice_reading_question_id_fkey" FOREIGN KEY ("reading_question_id") REFERENCES "public"."reading_question"("reading_question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_question_map" ADD CONSTRAINT "lesson_question_map_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("lesson_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."completed_user_lesson" ADD CONSTRAINT "completed_user_lesson_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("lesson_id") ON DELETE RESTRICT ON UPDATE CASCADE;
