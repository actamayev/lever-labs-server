/*
  Warnings:

  - You are about to drop the column `matching_answer_choice_id` on the `matching_question_user_answer` table. All the data in the column will be lost.
  - You are about to drop the `matching_answer_choice` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `coding_block_id` to the `matching_question_user_answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matching_answer_choice_text_id` to the `matching_question_user_answer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."matching_answer_choice" DROP CONSTRAINT "matching_answer_choice_coding_block_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."matching_answer_choice" DROP CONSTRAINT "matching_answer_choice_matching_question_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."matching_question_user_answer" DROP CONSTRAINT "matching_question_user_answer_matching_answer_choice_id_fkey";

-- DropIndex
DROP INDEX "public"."matching_question_user_answer_matching_answer_choice_id_idx";

-- AlterTable
ALTER TABLE "matching_question_user_answer" DROP COLUMN "matching_answer_choice_id",
ADD COLUMN     "coding_block_id" INTEGER NOT NULL,
ADD COLUMN     "matching_answer_choice_text_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."matching_answer_choice";

-- CreateTable
CREATE TABLE "matching_answer_choice_pair" (
    "matching_answer_choice_pair_id" INTEGER NOT NULL,
    "matching_question_id" TEXT NOT NULL,
    "coding_block_id" INTEGER NOT NULL,
    "matching_answer_choice_text_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "matching_answer_choice_pair_pkey" PRIMARY KEY ("matching_answer_choice_pair_id")
);

-- CreateTable
CREATE TABLE "matching_answer_choice_text" (
    "matching_answer_choice_text_id" INTEGER NOT NULL,
    "answer_choice_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matching_answer_choice_text_pkey" PRIMARY KEY ("matching_answer_choice_text_id")
);

-- CreateIndex
CREATE INDEX "matching_answer_choice_pair_matching_question_id_idx" ON "matching_answer_choice_pair"("matching_question_id");

-- CreateIndex
CREATE INDEX "matching_answer_choice_pair_coding_block_id_idx" ON "matching_answer_choice_pair"("coding_block_id");

-- CreateIndex
CREATE INDEX "matching_answer_choice_pair_matching_answer_choice_text_id_idx" ON "matching_answer_choice_pair"("matching_answer_choice_text_id");

-- CreateIndex
CREATE UNIQUE INDEX "matching_answer_choice_text_answer_choice_text_key" ON "matching_answer_choice_text"("answer_choice_text");

-- AddForeignKey
ALTER TABLE "matching_answer_choice_pair" ADD CONSTRAINT "matching_answer_choice_pair_matching_question_id_fkey" FOREIGN KEY ("matching_question_id") REFERENCES "matching_question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_answer_choice_pair" ADD CONSTRAINT "matching_answer_choice_pair_coding_block_id_fkey" FOREIGN KEY ("coding_block_id") REFERENCES "coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_answer_choice_pair" ADD CONSTRAINT "matching_answer_choice_pair_matching_answer_choice_text_id_fkey" FOREIGN KEY ("matching_answer_choice_text_id") REFERENCES "matching_answer_choice_text"("matching_answer_choice_text_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_question_user_answer" ADD CONSTRAINT "matching_question_user_answer_coding_block_id_fkey" FOREIGN KEY ("coding_block_id") REFERENCES "coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_question_user_answer" ADD CONSTRAINT "matching_question_user_answer_matching_answer_choice_text__fkey" FOREIGN KEY ("matching_answer_choice_text_id") REFERENCES "matching_answer_choice_text"("matching_answer_choice_text_id") ON DELETE RESTRICT ON UPDATE CASCADE;
