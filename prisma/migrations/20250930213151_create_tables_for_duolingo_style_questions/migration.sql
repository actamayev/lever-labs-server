-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('BLOCK_TO_FUNCTION', 'FUNCTION_TO_BLOCK', 'FILL_IN_BLANK');

-- CreateTable
CREATE TABLE "public"."question" (
    "question_id" TEXT NOT NULL,
    "question_type" "public"."QuestionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "public"."coding_block" (
    "coding_block_id" SERIAL NOT NULL,
    "block_name" TEXT NOT NULL,
    "motor_speed" INTEGER,
    "led_color" TEXT,
    "direction" TEXT,
    "delay_ms" INTEGER,
    "color_sensor_detection_color" TEXT,
    "speaker_sound" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_block_pkey" PRIMARY KEY ("coding_block_id")
);

-- CreateTable
CREATE TABLE "public"."lesson" (
    "lesson_id" SERIAL NOT NULL,
    "lesson_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("lesson_id")
);

-- CreateTable
CREATE TABLE "public"."lesson_question_map" (
    "lesson_question_map_id" SERIAL NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "question_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "lesson_question_map_pkey" PRIMARY KEY ("lesson_question_map_id")
);

-- CreateTable
CREATE TABLE "public"."lesson_user_progress" (
    "lesson_user_progress_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_user_progress_pkey" PRIMARY KEY ("lesson_user_progress_id")
);

-- CreateTable
CREATE TABLE "public"."block_to_function_flashcard" (
    "question_id" TEXT NOT NULL,
    "coding_block_id" INTEGER NOT NULL,

    CONSTRAINT "block_to_function_flashcard_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "public"."block_to_function_answer_choice" (
    "block_to_function_answer_choice_id" SERIAL NOT NULL,
    "block_to_function_flashcard_id" TEXT NOT NULL,
    "function_description_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "block_to_function_answer_choice_pkey" PRIMARY KEY ("block_to_function_answer_choice_id")
);

-- CreateTable
CREATE TABLE "public"."block_to_function_user_answer" (
    "block_to_function_user_answer_id" SERIAL NOT NULL,
    "block_to_function_answer_choice_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_to_function_user_answer_pkey" PRIMARY KEY ("block_to_function_user_answer_id")
);

-- CreateTable
CREATE TABLE "public"."function_to_block_flashcard" (
    "question_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,

    CONSTRAINT "function_to_block_flashcard_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "public"."function_to_block_answer_choice" (
    "function_to_block_answer_choice_id" SERIAL NOT NULL,
    "function_to_block_flashcard_id" TEXT NOT NULL,
    "coding_block_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "function_to_block_answer_choice_pkey" PRIMARY KEY ("function_to_block_answer_choice_id")
);

-- CreateTable
CREATE TABLE "public"."function_to_block_user_answer" (
    "function_to_block_user_answer_id" SERIAL NOT NULL,
    "function_to_block_answer_choice_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "function_to_block_user_answer_pkey" PRIMARY KEY ("function_to_block_user_answer_id")
);

-- CreateTable
CREATE TABLE "public"."fill_in_the_blank" (
    "question_id" TEXT NOT NULL,
    "initial_blockly_json" JSONB NOT NULL,
    "reference_solution_cpp" TEXT NOT NULL,

    CONSTRAINT "fill_in_the_blank_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "public"."fill_in_the_blank_block_bank" (
    "fill_in_the_blank_block_bank_id" SERIAL NOT NULL,
    "fill_in_the_blank_id" TEXT NOT NULL,
    "coding_block_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,

    CONSTRAINT "fill_in_the_blank_block_bank_pkey" PRIMARY KEY ("fill_in_the_blank_block_bank_id")
);

-- CreateTable
CREATE TABLE "public"."fill_in_the_blank_user_answer" (
    "fill_in_the_blank_user_answer_id" SERIAL NOT NULL,
    "fill_in_the_blank_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_cpp_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fill_in_the_blank_user_answer_pkey" PRIMARY KEY ("fill_in_the_blank_user_answer_id")
);

-- CreateIndex
CREATE INDEX "lesson_question_map_lesson_id_order_idx" ON "public"."lesson_question_map"("lesson_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_question_map_lesson_id_question_id_key" ON "public"."lesson_question_map"("lesson_id", "question_id");

-- CreateIndex
CREATE INDEX "lesson_user_progress_user_id_idx" ON "public"."lesson_user_progress"("user_id");

-- CreateIndex
CREATE INDEX "lesson_user_progress_lesson_id_idx" ON "public"."lesson_user_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_user_progress_user_id_lesson_id_key" ON "public"."lesson_user_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "block_to_function_answer_choice_block_to_function_flashcard_idx" ON "public"."block_to_function_answer_choice"("block_to_function_flashcard_id");

-- CreateIndex
CREATE INDEX "block_to_function_user_answer_user_id_idx" ON "public"."block_to_function_user_answer"("user_id");

-- CreateIndex
CREATE INDEX "block_to_function_user_answer_block_to_function_answer_choi_idx" ON "public"."block_to_function_user_answer"("block_to_function_answer_choice_id");

-- CreateIndex
CREATE INDEX "function_to_block_answer_choice_function_to_block_flashcard_idx" ON "public"."function_to_block_answer_choice"("function_to_block_flashcard_id");

-- CreateIndex
CREATE INDEX "function_to_block_answer_choice_coding_block_id_idx" ON "public"."function_to_block_answer_choice"("coding_block_id");

-- CreateIndex
CREATE INDEX "function_to_block_user_answer_user_id_idx" ON "public"."function_to_block_user_answer"("user_id");

-- CreateIndex
CREATE INDEX "function_to_block_user_answer_function_to_block_answer_choi_idx" ON "public"."function_to_block_user_answer"("function_to_block_answer_choice_id");

-- CreateIndex
CREATE INDEX "fill_in_the_blank_block_bank_fill_in_the_blank_id_idx" ON "public"."fill_in_the_blank_block_bank"("fill_in_the_blank_id");

-- CreateIndex
CREATE INDEX "fill_in_the_blank_block_bank_coding_block_id_idx" ON "public"."fill_in_the_blank_block_bank"("coding_block_id");

-- CreateIndex
CREATE INDEX "fill_in_the_blank_user_answer_user_id_idx" ON "public"."fill_in_the_blank_user_answer"("user_id");

-- CreateIndex
CREATE INDEX "fill_in_the_blank_user_answer_fill_in_the_blank_id_idx" ON "public"."fill_in_the_blank_user_answer"("fill_in_the_blank_id");

-- AddForeignKey
ALTER TABLE "public"."lesson_question_map" ADD CONSTRAINT "lesson_question_map_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("lesson_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_question_map" ADD CONSTRAINT "lesson_question_map_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_user_progress" ADD CONSTRAINT "lesson_user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_user_progress" ADD CONSTRAINT "lesson_user_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("lesson_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."block_to_function_flashcard" ADD CONSTRAINT "block_to_function_flashcard_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."block_to_function_answer_choice" ADD CONSTRAINT "block_to_function_answer_choice_block_to_function_flashcar_fkey" FOREIGN KEY ("block_to_function_flashcard_id") REFERENCES "public"."block_to_function_flashcard"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."block_to_function_user_answer" ADD CONSTRAINT "block_to_function_user_answer_block_to_function_answer_cho_fkey" FOREIGN KEY ("block_to_function_answer_choice_id") REFERENCES "public"."block_to_function_answer_choice"("block_to_function_answer_choice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."block_to_function_user_answer" ADD CONSTRAINT "block_to_function_user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."function_to_block_flashcard" ADD CONSTRAINT "function_to_block_flashcard_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."function_to_block_answer_choice" ADD CONSTRAINT "function_to_block_answer_choice_function_to_block_flashcar_fkey" FOREIGN KEY ("function_to_block_flashcard_id") REFERENCES "public"."function_to_block_flashcard"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."function_to_block_answer_choice" ADD CONSTRAINT "function_to_block_answer_choice_coding_block_id_fkey" FOREIGN KEY ("coding_block_id") REFERENCES "public"."coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."function_to_block_user_answer" ADD CONSTRAINT "function_to_block_user_answer_function_to_block_answer_cho_fkey" FOREIGN KEY ("function_to_block_answer_choice_id") REFERENCES "public"."function_to_block_answer_choice"("function_to_block_answer_choice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."function_to_block_user_answer" ADD CONSTRAINT "function_to_block_user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fill_in_the_blank" ADD CONSTRAINT "fill_in_the_blank_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fill_in_the_blank_block_bank" ADD CONSTRAINT "fill_in_the_blank_block_bank_fill_in_the_blank_id_fkey" FOREIGN KEY ("fill_in_the_blank_id") REFERENCES "public"."fill_in_the_blank"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fill_in_the_blank_block_bank" ADD CONSTRAINT "fill_in_the_blank_block_bank_coding_block_id_fkey" FOREIGN KEY ("coding_block_id") REFERENCES "public"."coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fill_in_the_blank_user_answer" ADD CONSTRAINT "fill_in_the_blank_user_answer_fill_in_the_blank_id_fkey" FOREIGN KEY ("fill_in_the_blank_id") REFERENCES "public"."fill_in_the_blank"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fill_in_the_blank_user_answer" ADD CONSTRAINT "fill_in_the_blank_user_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
