/*
  Warnings:

  - You are about to drop the column `challenge_id` on the `career_quest_chat` table. All the data in the column will be lost.
  - You are about to drop the column `is_locked` on the `career_user_progress` table. All the data in the column will be lost.
  - Added the required column `career_id` to the `career_quest_chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "career_quest_chat" DROP CONSTRAINT "career_quest_chat_challenge_id_fkey";

-- DropIndex
DROP INDEX "career_quest_chat__challenge_user_active_idx";

-- DropIndex
DROP INDEX "career_quest_message_career_quest_chat_id_created_at_idx";

-- AlterTable
ALTER TABLE "career_quest_chat" DROP COLUMN "challenge_id",
ADD COLUMN     "career_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "career_user_progress" DROP COLUMN "is_locked";

-- CreateTable
CREATE TABLE "challenge_chat" (
    "challenge_chat_id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "challenge_chat_pkey" PRIMARY KEY ("challenge_chat_id")
);

-- CreateTable
CREATE TABLE "challenge_message" (
    "challenge_message_id" SERIAL NOT NULL,
    "message_text" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "model_used" TEXT,
    "challenge_chat_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_message_pkey" PRIMARY KEY ("challenge_message_id")
);

-- CreateIndex
CREATE INDEX "career_quest_chat__challenge_user_active_idx" ON "challenge_chat"("challenge_id", "user_id", "is_active");

-- CreateIndex
CREATE INDEX "challenge_message_challenge_chat_id_created_at_idx" ON "challenge_message"("challenge_chat_id", "created_at");

-- CreateIndex
CREATE INDEX "career_quest_chat__career_user_active_idx" ON "career_quest_chat"("career_id", "user_id", "is_active");

-- CreateIndex
CREATE INDEX "career_quest_chat__career_id_idx" ON "career_quest_chat"("career_id");

-- AddForeignKey
ALTER TABLE "challenge_chat" ADD CONSTRAINT "challenge_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_chat" ADD CONSTRAINT "challenge_chat_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quest_chat" ADD CONSTRAINT "career_quest_chat_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "career"("career_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_message" ADD CONSTRAINT "challenge_message_challenge_chat_id_fkey" FOREIGN KEY ("challenge_chat_id") REFERENCES "challenge_chat"("challenge_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;
