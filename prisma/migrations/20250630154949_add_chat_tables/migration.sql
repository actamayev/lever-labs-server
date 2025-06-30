-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('USER', 'AI');

-- CreateTable
CREATE TABLE "career_quest_chat" (
    "career_quest_chat_id" SERIAL NOT NULL,
    "career_quest_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_quest_chat_pkey" PRIMARY KEY ("career_quest_chat_id")
);

-- CreateTable
CREATE TABLE "sandbox_chat" (
    "sandbox_chat_id" SERIAL NOT NULL,
    "sandbox_project_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_chat_pkey" PRIMARY KEY ("sandbox_chat_id")
);

-- CreateTable
CREATE TABLE "career_quest_message" (
    "message_id" SERIAL NOT NULL,
    "message_text" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "model_used" TEXT,
    "career_quest_chat_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_quest_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "sandbox_message" (
    "message_id" SERIAL NOT NULL,
    "message_text" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "model_used" TEXT,
    "sandbox_chat_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE INDEX "career_quest_chat_user_id_idx" ON "career_quest_chat"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_quest_chat_career_quest_id_user_id_key" ON "career_quest_chat"("career_quest_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_chat_sandbox_project_id_key" ON "sandbox_chat"("sandbox_project_id");

-- CreateIndex
CREATE INDEX "career_quest_message_career_quest_chat_id_created_at_idx" ON "career_quest_message"("career_quest_chat_id", "created_at");

-- CreateIndex
CREATE INDEX "sandbox_message_sandbox_chat_id_created_at_idx" ON "sandbox_message"("sandbox_chat_id", "created_at");

-- AddForeignKey
ALTER TABLE "career_quest_chat" ADD CONSTRAINT "career_quest_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_chat" ADD CONSTRAINT "sandbox_chat_sandbox_project_id_fkey" FOREIGN KEY ("sandbox_project_id") REFERENCES "sandbox_project"("sandbox_project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quest_message" ADD CONSTRAINT "career_quest_message_career_quest_chat_id_fkey" FOREIGN KEY ("career_quest_chat_id") REFERENCES "career_quest_chat"("career_quest_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_message" ADD CONSTRAINT "sandbox_message_sandbox_chat_id_fkey" FOREIGN KEY ("sandbox_chat_id") REFERENCES "sandbox_chat"("sandbox_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;
