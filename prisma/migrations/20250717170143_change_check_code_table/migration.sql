/*
  Warnings:

  - You are about to drop the column `evaluation_result` on the `career_quest_code_submission` table. All the data in the column will be lost.
  - You are about to drop the column `model_used` on the `career_quest_code_submission` table. All the data in the column will be lost.
  - Added the required column `feedback` to the `career_quest_code_submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hint_number` to the `career_quest_hint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "career_quest_code_submission" DROP COLUMN "evaluation_result",
DROP COLUMN "model_used",
ADD COLUMN     "feedback" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "career_quest_hint" ADD COLUMN     "hint_number" INTEGER NOT NULL;
