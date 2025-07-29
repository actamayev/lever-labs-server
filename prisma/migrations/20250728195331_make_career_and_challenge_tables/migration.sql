/*
  Warnings:

  - Changed the type of `challenge_id` on the `career_quest_chat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `challenge_id` on the `career_quest_sandbox` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "career_quest_chat_challenge_id_idx";

-- DropIndex
DROP INDEX "career_quest_chat_user_id_idx";

-- AlterTable
ALTER TABLE "career_quest_chat" DROP COLUMN "challenge_id",
ADD COLUMN     "challenge_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "career_quest_sandbox" DROP COLUMN "challenge_id",
ADD COLUMN     "challenge_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "career" (
    "career_id" SERIAL NOT NULL,
    "career_name" TEXT NOT NULL,
    "career_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_pkey" PRIMARY KEY ("career_id")
);

-- CreateTable
CREATE TABLE "challenge" (
    "challenge_id" SERIAL NOT NULL,
    "challenge_name" TEXT NOT NULL,
    "challenge_uuid" TEXT NOT NULL,
    "career_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_career_uuid_key" ON "career"("career_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_challenge_uuid_key" ON "challenge"("challenge_uuid");

-- CreateIndex
CREATE INDEX "career_quest_chat_user_id_challenge_id_idx" ON "career_quest_chat"("user_id", "challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_quest_sandbox_user_id_challenge_id_key" ON "career_quest_sandbox"("user_id", "challenge_id");

-- AddForeignKey
ALTER TABLE "career_quest_chat" ADD CONSTRAINT "career_quest_chat_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quest_sandbox" ADD CONSTRAINT "career_quest_sandbox_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge" ADD CONSTRAINT "challenge_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "career"("career_id") ON DELETE RESTRICT ON UPDATE CASCADE;
