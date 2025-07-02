/*
  Warnings:

  - The primary key for the `career_quest_message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `message_id` on the `career_quest_message` table. All the data in the column will be lost.
  - The primary key for the `sandbox_message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `message_id` on the `sandbox_message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "career_quest_message" DROP CONSTRAINT "career_quest_message_pkey",
DROP COLUMN "message_id",
ADD COLUMN     "career_quest_message_id" SERIAL NOT NULL,
ADD CONSTRAINT "career_quest_message_pkey" PRIMARY KEY ("career_quest_message_id");

-- AlterTable
ALTER TABLE "sandbox_message" DROP CONSTRAINT "sandbox_message_pkey",
DROP COLUMN "message_id",
ADD COLUMN     "sandbox_message_id" SERIAL NOT NULL,
ADD CONSTRAINT "sandbox_message_pkey" PRIMARY KEY ("sandbox_message_id");
