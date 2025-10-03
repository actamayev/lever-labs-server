/*
  Warnings:

  - A unique constraint covering the columns `[lesson_uuid]` on the table `lesson` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lesson_uuid` to the `lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."lesson" ADD COLUMN     "lesson_uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lesson_lesson_uuid_key" ON "public"."lesson"("lesson_uuid");
