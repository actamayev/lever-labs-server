/*
  Warnings:

  - Made the column `model_used` on table `career_quest_code_submission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "career_quest_code_submission" ALTER COLUMN "model_used" SET NOT NULL;

-- CreateTable
CREATE TABLE "career_quest_hint" (
    "career_quest_hint_id" SERIAL NOT NULL,
    "career_quest_chat_id" INTEGER NOT NULL,
    "hint_text" TEXT NOT NULL,
    "model_used" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_quest_hint_pkey" PRIMARY KEY ("career_quest_hint_id")
);

-- CreateIndex
CREATE INDEX "career_quest_hint_career_quest_chat_id_created_at_idx" ON "career_quest_hint"("career_quest_chat_id", "created_at");

-- AddForeignKey
ALTER TABLE "career_quest_hint" ADD CONSTRAINT "career_quest_hint_career_quest_chat_id_fkey" FOREIGN KEY ("career_quest_chat_id") REFERENCES "career_quest_chat"("career_quest_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;
