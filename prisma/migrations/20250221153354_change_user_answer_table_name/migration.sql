/*
  Warnings:

  - You are about to drop the `user_answers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_answers" DROP CONSTRAINT "user_answers_reading_question_answer_choice_id_fkey";

-- DropForeignKey
ALTER TABLE "user_answers" DROP CONSTRAINT "user_answers_user_id_fkey";

-- DropTable
DROP TABLE "user_answers";

-- CreateTable
CREATE TABLE "user_answer" (
    "user_answers_id" SERIAL NOT NULL,
    "reading_question_answer_choice_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answer_pkey" PRIMARY KEY ("user_answers_id")
);

-- CreateIndex
CREATE INDEX "user_answers__reading_question_answer_choice_id_idx" ON "user_answer"("reading_question_answer_choice_id");

-- CreateIndex
CREATE INDEX "user_answers__user_id_idx" ON "user_answer"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_answer_reading_question_answer_choice_id_user_id_key" ON "user_answer"("reading_question_answer_choice_id", "user_id");

-- AddForeignKey
ALTER TABLE "user_answer" ADD CONSTRAINT "user_answer_reading_question_answer_choice_id_fkey" FOREIGN KEY ("reading_question_answer_choice_id") REFERENCES "reading_question_answer_choice"("reading_question_answer_choice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answer" ADD CONSTRAINT "user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
