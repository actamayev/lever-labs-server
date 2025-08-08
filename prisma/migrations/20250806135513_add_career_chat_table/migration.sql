/*
  Warnings:

  - You are about to drop the `career_quest_chat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `career_quest_message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "career_quest_chat" DROP CONSTRAINT "career_quest_chat_career_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_chat" DROP CONSTRAINT "career_quest_chat_user_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_message" DROP CONSTRAINT "career_quest_message_career_quest_chat_id_fkey";

-- DropTable
DROP TABLE "career_quest_chat";

-- DropTable
DROP TABLE "career_quest_message";

-- CreateTable
CREATE TABLE "career_chat" (
    "career_chat_id" SERIAL NOT NULL,
    "career_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "career_chat_pkey" PRIMARY KEY ("career_chat_id")
);

-- CreateTable
CREATE TABLE "career_message" (
    "career_message_id" SERIAL NOT NULL,
    "message_text" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "model_used" TEXT,
    "career_chat_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_message_pkey" PRIMARY KEY ("career_message_id")
);

-- CreateIndex
CREATE INDEX "career_chat__career_user_active_idx" ON "career_chat"("career_id", "user_id", "is_active");

-- CreateIndex
CREATE INDEX "career_chat__career_id_idx" ON "career_chat"("career_id");

-- AddForeignKey
ALTER TABLE "career_chat" ADD CONSTRAINT "career_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_chat" ADD CONSTRAINT "career_chat_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "career"("career_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_message" ADD CONSTRAINT "career_message_career_chat_id_fkey" FOREIGN KEY ("career_chat_id") REFERENCES "career_chat"("career_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "career_quest_chat__challenge_user_active_idx" RENAME TO "challenge_chat__challenge_user_active_idx";
