/*
  Warnings:

  - You are about to drop the column `accepted_at` on the `student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "student" DROP COLUMN "accepted_at",
ADD COLUMN     "joined_classroom_at" TIMESTAMP(3);
