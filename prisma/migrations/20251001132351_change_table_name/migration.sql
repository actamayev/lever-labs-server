/*
  Warnings:

  - You are about to drop the `lesson_user_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."lesson_user_progress" DROP CONSTRAINT "lesson_user_progress_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."lesson_user_progress" DROP CONSTRAINT "lesson_user_progress_user_id_fkey";

-- DropTable
DROP TABLE "public"."lesson_user_progress";

-- CreateTable
CREATE TABLE "public"."completed_user_lesson" (
    "completed_user_lesson_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completed_user_lesson_pkey" PRIMARY KEY ("completed_user_lesson_id")
);

-- CreateIndex
CREATE INDEX "completed_user_lesson_user_id_idx" ON "public"."completed_user_lesson"("user_id");

-- CreateIndex
CREATE INDEX "completed_user_lesson_lesson_id_idx" ON "public"."completed_user_lesson"("lesson_id");

-- AddForeignKey
ALTER TABLE "public"."completed_user_lesson" ADD CONSTRAINT "completed_user_lesson_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."completed_user_lesson" ADD CONSTRAINT "completed_user_lesson_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("lesson_id") ON DELETE RESTRICT ON UPDATE CASCADE;
