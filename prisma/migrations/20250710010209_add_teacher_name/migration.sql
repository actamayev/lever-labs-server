/*
  Warnings:

  - Added the required column `teacher_name` to the `teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teacher" ADD COLUMN     "teacher_name" TEXT NOT NULL;
