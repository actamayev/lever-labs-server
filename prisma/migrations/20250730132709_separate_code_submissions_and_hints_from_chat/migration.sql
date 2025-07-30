/*
  Warnings:

  - You are about to drop the column `career_quest_chat_id` on the `career_quest_code_submission` table. All the data in the column will be lost.
  - You are about to drop the column `challenge_snapshot` on the `career_quest_code_submission` table. All the data in the column will be lost.
  - You are about to drop the column `career_quest_chat_id` on the `career_quest_hint` table. All the data in the column will be lost.
  - Added the required column `challenge_id` to the `career_quest_code_submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `career_quest_code_submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `challenge_id` to the `career_quest_hint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `career_quest_hint` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "career_quest_code_submission" DROP CONSTRAINT "career_quest_code_submission_career_quest_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_hint" DROP CONSTRAINT "career_quest_hint_career_quest_chat_id_fkey";

-- DropIndex
DROP INDEX "career_quest_code_submission_career_quest_chat_id_created_a_idx";

-- DropIndex
DROP INDEX "career_quest_hint_career_quest_chat_id_created_at_idx";

-- AlterTable
ALTER TABLE "career_quest_code_submission" DROP COLUMN "career_quest_chat_id",
DROP COLUMN "challenge_snapshot",
ADD COLUMN     "challenge_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "career_quest_hint" DROP COLUMN "career_quest_chat_id",
ADD COLUMN     "challenge_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "career_quest_code_submission_user_id_idx" ON "career_quest_code_submission"("user_id");

-- CreateIndex
CREATE INDEX "career_quest_code_submission_challenge_id_user_id_idx" ON "career_quest_code_submission"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "career_quest_code_submission_challenge_id_created_at_idx" ON "career_quest_code_submission"("challenge_id", "created_at");

-- CreateIndex
CREATE INDEX "career_quest_hint_user_id_idx" ON "career_quest_hint"("user_id");

-- CreateIndex
CREATE INDEX "career_quest_hint_challenge_id_user_id_idx" ON "career_quest_hint"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "career_quest_hint_challenge_id_created_at_idx" ON "career_quest_hint"("challenge_id", "created_at");

-- AddForeignKey
ALTER TABLE "career_quest_hint" ADD CONSTRAINT "career_quest_hint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quest_hint" ADD CONSTRAINT "career_quest_hint_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quest_code_submission" ADD CONSTRAINT "career_quest_code_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quest_code_submission" ADD CONSTRAINT "career_quest_code_submission_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;
