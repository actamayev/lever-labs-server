/*
  Warnings:

  - You are about to drop the column `career_quest_id` on the `career_quest_sandbox` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,challenge_id]` on the table `career_quest_sandbox` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `challenge_id` to the `career_quest_sandbox` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "career_quest_sandbox_user_id_career_quest_id_key";

-- AlterTable
ALTER TABLE "career_quest_sandbox" DROP COLUMN "career_quest_id",
ADD COLUMN     "challenge_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "career_quest_sandbox_user_id_challenge_id_key" ON "career_quest_sandbox"("user_id", "challenge_id");
