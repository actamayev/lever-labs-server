-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'MATCHING';

-- CreateTable
CREATE TABLE "matching_question" (
    "question_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,

    CONSTRAINT "matching_question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "matching_answer_choice" (
    "matching_answer_choice_id" INTEGER NOT NULL,
    "matching_question_id" TEXT NOT NULL,
    "coding_block_id" INTEGER NOT NULL,
    "block_description" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "matching_answer_choice_pkey" PRIMARY KEY ("matching_answer_choice_id")
);

-- CreateTable
CREATE TABLE "matching_question_user_answer" (
    "matching_question_user_answer_id" SERIAL NOT NULL,
    "matching_answer_choice_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matching_question_user_answer_pkey" PRIMARY KEY ("matching_question_user_answer_id")
);

-- CreateIndex
CREATE INDEX "matching_answer_choice_matching_question_id_idx" ON "matching_answer_choice"("matching_question_id");

-- CreateIndex
CREATE INDEX "matching_answer_choice_coding_block_id_idx" ON "matching_answer_choice"("coding_block_id");

-- CreateIndex
CREATE INDEX "matching_question_user_answer_user_id_idx" ON "matching_question_user_answer"("user_id");

-- CreateIndex
CREATE INDEX "matching_question_user_answer_matching_answer_choice_id_idx" ON "matching_question_user_answer"("matching_answer_choice_id");

-- AddForeignKey
ALTER TABLE "matching_question" ADD CONSTRAINT "matching_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_answer_choice" ADD CONSTRAINT "matching_answer_choice_matching_question_id_fkey" FOREIGN KEY ("matching_question_id") REFERENCES "matching_question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_answer_choice" ADD CONSTRAINT "matching_answer_choice_coding_block_id_fkey" FOREIGN KEY ("coding_block_id") REFERENCES "coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_question_user_answer" ADD CONSTRAINT "matching_question_user_answer_matching_answer_choice_id_fkey" FOREIGN KEY ("matching_answer_choice_id") REFERENCES "matching_answer_choice"("matching_answer_choice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_question_user_answer" ADD CONSTRAINT "matching_question_user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
