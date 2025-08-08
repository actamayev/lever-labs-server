/*
  Warnings:

  - You are about to drop the `career_quest_code_submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `career_quest_hint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `career_quest_sandbox` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "career_quest_code_submission" DROP CONSTRAINT "career_quest_code_submission_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_code_submission" DROP CONSTRAINT "career_quest_code_submission_user_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_hint" DROP CONSTRAINT "career_quest_hint_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_hint" DROP CONSTRAINT "career_quest_hint_user_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_sandbox" DROP CONSTRAINT "career_quest_sandbox_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "career_quest_sandbox" DROP CONSTRAINT "career_quest_sandbox_user_id_fkey";

-- DropTable
DROP TABLE "career_quest_code_submission";

-- DropTable
DROP TABLE "career_quest_hint";

-- DropTable
DROP TABLE "career_quest_sandbox";

-- CreateTable
CREATE TABLE "challenge_hint" (
    "challenge_hint_id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hint_text" TEXT NOT NULL,
    "model_used" TEXT NOT NULL,
    "hint_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_hint_pkey" PRIMARY KEY ("challenge_hint_id")
);

-- CreateTable
CREATE TABLE "challenge_code_submission" (
    "submission_id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_code" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_code_submission_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "challenge_sandbox" (
    "challenge_sandbox_id" SERIAL NOT NULL,
    "challenge_sandbox_json" JSONB NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_sandbox_pkey" PRIMARY KEY ("challenge_sandbox_id")
);

-- CreateIndex
CREATE INDEX "challenge_hint_user_id_idx" ON "challenge_hint"("user_id");

-- CreateIndex
CREATE INDEX "challenge_hint_challenge_id_user_id_idx" ON "challenge_hint"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "challenge_hint_challenge_id_created_at_idx" ON "challenge_hint"("challenge_id", "created_at");

-- CreateIndex
CREATE INDEX "challenge_code_submission_user_id_idx" ON "challenge_code_submission"("user_id");

-- CreateIndex
CREATE INDEX "challenge_code_submission_challenge_id_user_id_idx" ON "challenge_code_submission"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "challenge_code_submission_challenge_id_created_at_idx" ON "challenge_code_submission"("challenge_id", "created_at");

-- CreateIndex
CREATE INDEX "challenge_sandbox__user_id_idx" ON "challenge_sandbox"("user_id");

-- CreateIndex
CREATE INDEX "challenge_sandbox__challenge_user_idx" ON "challenge_sandbox"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "challenge_sandbox__challenge_id_idx" ON "challenge_sandbox"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_sandbox_user_id_challenge_id_key" ON "challenge_sandbox"("user_id", "challenge_id");

-- AddForeignKey
ALTER TABLE "challenge_hint" ADD CONSTRAINT "challenge_hint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_hint" ADD CONSTRAINT "challenge_hint_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_code_submission" ADD CONSTRAINT "challenge_code_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_code_submission" ADD CONSTRAINT "challenge_code_submission_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_sandbox" ADD CONSTRAINT "challenge_sandbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_sandbox" ADD CONSTRAINT "challenge_sandbox_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;
