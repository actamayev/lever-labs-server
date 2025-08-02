/*
  Warnings:

  - A unique constraint covering the columns `[user_id,career_id]` on the table `career_user_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "career_user_progress_user_id_career_id_challenge_uuid_or_te_idx";

-- DropIndex
DROP INDEX "career_user_progress_user_id_career_id_challenge_uuid_or_te_key";

-- CreateIndex
CREATE INDEX "career_user_progress_user_id_career_id_idx" ON "career_user_progress"("user_id", "career_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_user_progress_user_id_career_id_key" ON "career_user_progress"("user_id", "career_id");
