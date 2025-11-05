/*
  Warnings:

  - Added the required column `is_correct` to the `matching_question_user_answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "matching_question_user_answer" ADD COLUMN     "is_correct" BOOLEAN NOT NULL;
