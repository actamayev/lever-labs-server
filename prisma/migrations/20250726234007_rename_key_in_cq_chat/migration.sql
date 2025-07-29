/*
  Warnings:

  - You are about to drop the column `career_quest_id` on the `career_quest_chat` table. All the data in the column will be lost.
  - Added the required column `challenge_id` to the `career_quest_chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "career_quest_chat_career_quest_id_idx";

-- AlterTable
ALTER TABLE "career_quest_chat" DROP COLUMN "career_quest_id",
ADD COLUMN     "challenge_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "career_quest_chat_challenge_id_idx" ON "career_quest_chat"("challenge_id");
