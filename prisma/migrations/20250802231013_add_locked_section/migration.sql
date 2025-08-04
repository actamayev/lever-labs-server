/*
  Warnings:

  - You are about to drop the column `challenge_id_or_text_id` on the `career_user_progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,career_id,challenge_uuid_or_text_uuid]` on the table `career_user_progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `challenge_uuid_or_text_uuid` to the `career_user_progress` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "career_quest_chat_user_id_challenge_id_idx";

-- DropIndex
DROP INDEX "career_user_progress_user_id_career_id_challenge_id_or_text_idx";

-- DropIndex
DROP INDEX "career_user_progress_user_id_career_id_challenge_id_or_text_key";

-- AlterTable
ALTER TABLE "career_user_progress" DROP COLUMN "challenge_id_or_text_id",
ADD COLUMN     "challenge_uuid_or_text_uuid" TEXT NOT NULL,
ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "career_quest_chat__challenge_user_active_idx" ON "career_quest_chat"("challenge_id", "user_id", "is_active");

-- CreateIndex
CREATE INDEX "career_quest_sandbox__challenge_user_idx" ON "career_quest_sandbox"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "career_quest_sandbox__challenge_id_idx" ON "career_quest_sandbox"("challenge_id");

-- CreateIndex
CREATE INDEX "career_user_progress_user_id_career_id_challenge_uuid_or_te_idx" ON "career_user_progress"("user_id", "career_id", "challenge_uuid_or_text_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "career_user_progress_user_id_career_id_challenge_uuid_or_te_key" ON "career_user_progress"("user_id", "career_id", "challenge_uuid_or_text_uuid");

-- CreateIndex
CREATE INDEX "challenge__career_id_idx" ON "challenge"("career_id");

-- CreateIndex
CREATE INDEX "challenge__career_id_created_at_idx" ON "challenge"("career_id", "created_at");
