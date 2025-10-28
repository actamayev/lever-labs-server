/*
  Warnings:

  - A unique constraint covering the columns `[fill_in_the_blank_id,block_name_id]` on the table `fill_in_the_blank_block_bank` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "action_to_code_multiple_choice_question" (
    "question_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "reference_solution_cpp" TEXT NOT NULL,

    CONSTRAINT "action_to_code_multiple_choice_question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "action_to_code_multiple_choice_answer_choice" (
    "action_to_code_multiple_choice_answer_choice_id" INTEGER NOT NULL,
    "action_to_code_multiple_choice_id" TEXT NOT NULL,
    "coding_block_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "action_to_code_multiple_choice_answer_choice_pkey" PRIMARY KEY ("action_to_code_multiple_choice_answer_choice_id")
);

-- CreateTable
CREATE TABLE "action_to_code_multiple_choice_user_answer" (
    "action_to_code_multiple_choice_user_answer_id" SERIAL NOT NULL,
    "action_to_code_multiple_choice_answer_choice_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_to_code_multiple_choice_user_answer_pkey" PRIMARY KEY ("action_to_code_multiple_choice_user_answer_id")
);

-- CreateTable
CREATE TABLE "action_to_code_open_ended_question" (
    "question_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "initial_blockly_json" JSONB NOT NULL,
    "reference_solution_cpp" TEXT NOT NULL,

    CONSTRAINT "action_to_code_open_ended_question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "action_to_code_open_ended_question_block_bank" (
    "action_to_code_open_ended_question_block_bank_id" INTEGER NOT NULL,
    "action_to_code_open_ended_question_id" TEXT NOT NULL,
    "block_name_id" INTEGER NOT NULL,

    CONSTRAINT "action_to_code_open_ended_question_block_bank_pkey" PRIMARY KEY ("action_to_code_open_ended_question_block_bank_id")
);

-- CreateTable
CREATE TABLE "action_to_code_open_ended_question_user_answer" (
    "action_to_code_open_ended_question_user_answer_id" SERIAL NOT NULL,
    "action_to_code_open_ended_question_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_cpp_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_to_code_open_ended_question_user_answer_pkey" PRIMARY KEY ("action_to_code_open_ended_question_user_answer_id")
);

-- CreateIndex
CREATE INDEX "action_to_code_multiple_choice_answer_choice_action_to_code_idx" ON "action_to_code_multiple_choice_answer_choice"("action_to_code_multiple_choice_id");

-- CreateIndex
CREATE INDEX "action_to_code_multiple_choice_answer_choice_coding_block_i_idx" ON "action_to_code_multiple_choice_answer_choice"("coding_block_id");

-- CreateIndex
CREATE INDEX "action_to_code_multiple_choice_user_answer_user_id_idx" ON "action_to_code_multiple_choice_user_answer"("user_id");

-- CreateIndex
CREATE INDEX "action_to_code_multiple_choice_user_answer_action_to_code_m_idx" ON "action_to_code_multiple_choice_user_answer"("action_to_code_multiple_choice_answer_choice_id");

-- CreateIndex
CREATE INDEX "action_to_code_open_ended_question_block_bank_action_to_cod_idx" ON "action_to_code_open_ended_question_block_bank"("action_to_code_open_ended_question_id");

-- CreateIndex
CREATE INDEX "action_to_code_open_ended_question_block_bank_block_name_id_idx" ON "action_to_code_open_ended_question_block_bank"("block_name_id");

-- CreateIndex
CREATE UNIQUE INDEX "action_to_code_open_ended_question_block_bank_action_to_cod_key" ON "action_to_code_open_ended_question_block_bank"("action_to_code_open_ended_question_id", "block_name_id");

-- CreateIndex
CREATE INDEX "action_to_code_open_ended_question_user_answer_user_id_idx" ON "action_to_code_open_ended_question_user_answer"("user_id");

-- CreateIndex
CREATE INDEX "action_to_code_open_ended_question_user_answer_action_to_co_idx" ON "action_to_code_open_ended_question_user_answer"("action_to_code_open_ended_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "fill_in_the_blank_block_bank_fill_in_the_blank_id_block_nam_key" ON "fill_in_the_blank_block_bank"("fill_in_the_blank_id", "block_name_id");

-- AddForeignKey
ALTER TABLE "action_to_code_multiple_choice_question" ADD CONSTRAINT "action_to_code_multiple_choice_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_multiple_choice_answer_choice" ADD CONSTRAINT "action_to_code_multiple_choice_answer_choice_action_to_cod_fkey" FOREIGN KEY ("action_to_code_multiple_choice_id") REFERENCES "action_to_code_multiple_choice_question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_multiple_choice_answer_choice" ADD CONSTRAINT "action_to_code_multiple_choice_answer_choice_coding_block__fkey" FOREIGN KEY ("coding_block_id") REFERENCES "coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_multiple_choice_user_answer" ADD CONSTRAINT "action_to_code_multiple_choice_user_answer_action_to_code__fkey" FOREIGN KEY ("action_to_code_multiple_choice_answer_choice_id") REFERENCES "action_to_code_multiple_choice_answer_choice"("action_to_code_multiple_choice_answer_choice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_multiple_choice_user_answer" ADD CONSTRAINT "action_to_code_multiple_choice_user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_open_ended_question" ADD CONSTRAINT "action_to_code_open_ended_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_open_ended_question_block_bank" ADD CONSTRAINT "action_to_code_open_ended_question_block_bank_action_to_co_fkey" FOREIGN KEY ("action_to_code_open_ended_question_id") REFERENCES "action_to_code_open_ended_question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_open_ended_question_block_bank" ADD CONSTRAINT "action_to_code_open_ended_question_block_bank_block_name_i_fkey" FOREIGN KEY ("block_name_id") REFERENCES "block_name"("block_name_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_open_ended_question_user_answer" ADD CONSTRAINT "action_to_code_open_ended_question_user_answer_action_to_c_fkey" FOREIGN KEY ("action_to_code_open_ended_question_id") REFERENCES "action_to_code_open_ended_question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_to_code_open_ended_question_user_answer" ADD CONSTRAINT "action_to_code_open_ended_question_user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
