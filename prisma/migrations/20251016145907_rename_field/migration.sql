/*
  Warnings:

  - You are about to drop the column `question_title` on the `block_to_function_flashcard` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."block_to_function_flashcard" DROP COLUMN "question_title",
ADD COLUMN     "question_text" TEXT NOT NULL DEFAULT '';
