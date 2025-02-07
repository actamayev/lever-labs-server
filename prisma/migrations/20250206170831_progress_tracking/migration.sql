-- CreateEnum
CREATE TYPE "ActivityTypes" AS ENUM ('Reading', 'Code', 'Video', 'Demo');

-- CreateEnum
CREATE TYPE "LessonNames" AS ENUM ('LED', 'Motor', 'IMU', 'Button');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "activity" (
    "activity_id" SERIAL NOT NULL,
    "lesson_name" "LessonNames" NOT NULL,
    "activity_type" "ActivityTypes" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "user_activity_progress" (
    "user_activity_progress_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "status" "ProgressStatus" NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_progress_pkey" PRIMARY KEY ("user_activity_progress_id")
);

-- CreateTable
CREATE TABLE "reading_question" (
    "reading_question_id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_question_pkey" PRIMARY KEY ("reading_question_id")
);

-- CreateTable
CREATE TABLE "reading_question_answer_choice" (
    "reading_question_answer_choice_id" SERIAL NOT NULL,
    "reading_question_id" INTEGER NOT NULL,
    "answer_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_question_answer_choice_pkey" PRIMARY KEY ("reading_question_answer_choice_id")
);

-- CreateTable
CREATE TABLE "user_answers" (
    "user_answers_id" SERIAL NOT NULL,
    "reading_question_answer_choice_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("user_answers_id")
);

-- CreateIndex
CREATE INDEX "user_activity_progress__user_id_idx" ON "user_activity_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_activity_progress__activity_id_idx" ON "user_activity_progress"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_progress_user_id_activity_id_key" ON "user_activity_progress"("user_id", "activity_id");

-- CreateIndex
CREATE INDEX "reading_question__activity_id_idx" ON "reading_question"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_question_activity_id_question_text_key" ON "reading_question"("activity_id", "question_text");

-- CreateIndex
CREATE INDEX "reading_question_answer_choice__reading_question_id_idx" ON "reading_question_answer_choice"("reading_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_question_answer_choice_reading_question_id_answer_t_key" ON "reading_question_answer_choice"("reading_question_id", "answer_text");

-- CreateIndex
CREATE INDEX "user_answers__reading_question_answer_choice_id_idx" ON "user_answers"("reading_question_answer_choice_id");

-- CreateIndex
CREATE INDEX "user_answers__user_id_idx" ON "user_answers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_answers_reading_question_answer_choice_id_user_id_key" ON "user_answers"("reading_question_answer_choice_id", "user_id");

-- AddForeignKey
ALTER TABLE "user_activity_progress" ADD CONSTRAINT "user_activity_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_progress" ADD CONSTRAINT "user_activity_progress_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_question" ADD CONSTRAINT "reading_question_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_question_answer_choice" ADD CONSTRAINT "reading_question_answer_choice_reading_question_id_fkey" FOREIGN KEY ("reading_question_id") REFERENCES "reading_question"("reading_question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_reading_question_answer_choice_id_fkey" FOREIGN KEY ("reading_question_answer_choice_id") REFERENCES "reading_question_answer_choice"("reading_question_answer_choice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
