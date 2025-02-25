/*
  Warnings:

  - A unique constraint covering the columns `[activity_uuid]` on the table `activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[activity_type,activity_name]` on the table `activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reading_question_uuid]` on the table `reading_question` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_name` to the `activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activity_uuid` to the `activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reading_question_uuid` to the `reading_question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `explanation` to the `reading_question_answer_choice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "activity" ADD COLUMN     "activity_name" TEXT NOT NULL,
ADD COLUMN     "activity_uuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reading_question" ADD COLUMN     "reading_question_uuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reading_question_answer_choice" ADD COLUMN     "explanation" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "activity_activity_uuid_key" ON "activity"("activity_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "activity_activity_type_activity_name_key" ON "activity"("activity_type", "activity_name");

-- CreateIndex
CREATE UNIQUE INDEX "reading_question_reading_question_uuid_key" ON "reading_question"("reading_question_uuid");
