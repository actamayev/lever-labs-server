/*
  Warnings:

  - Added the required column `score` to the `career_quest_code_submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "career_quest_code_submission" ADD COLUMN     "score" DOUBLE PRECISION NOT NULL;
