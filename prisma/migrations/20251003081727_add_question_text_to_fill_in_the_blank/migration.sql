/*
  Warnings:

  - Added the required column `question_text` to the `fill_in_the_blank` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."fill_in_the_blank" ADD COLUMN     "question_text" TEXT NOT NULL;
