/*
  Warnings:

  - You are about to drop the `activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `completed_reading_block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reading_block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reading_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reading_question_answer_choice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_activity_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_answer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."completed_reading_block" DROP CONSTRAINT "completed_reading_block_reading_block_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."completed_reading_block" DROP CONSTRAINT "completed_reading_block_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_block" DROP CONSTRAINT "reading_block_reading_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_question" DROP CONSTRAINT "reading_question_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_question_answer_choice" DROP CONSTRAINT "reading_question_answer_choice_reading_question_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_activity_progress" DROP CONSTRAINT "user_activity_progress_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_activity_progress" DROP CONSTRAINT "user_activity_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_answer" DROP CONSTRAINT "user_answer_reading_question_answer_choice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_answer" DROP CONSTRAINT "user_answer_user_id_fkey";

-- DropTable
DROP TABLE "public"."activity";

-- DropTable
DROP TABLE "public"."completed_reading_block";

-- DropTable
DROP TABLE "public"."reading_block";

-- DropTable
DROP TABLE "public"."reading_question";

-- DropTable
DROP TABLE "public"."reading_question_answer_choice";

-- DropTable
DROP TABLE "public"."user_activity_progress";

-- DropTable
DROP TABLE "public"."user_answer";

-- DropEnum
DROP TYPE "public"."ActivityTypes";

-- DropEnum
DROP TYPE "public"."LessonNames";

-- DropEnum
DROP TYPE "public"."ProgressStatus";
