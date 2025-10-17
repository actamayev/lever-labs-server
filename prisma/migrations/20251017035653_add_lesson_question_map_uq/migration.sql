/*
  Warnings:

  - A unique constraint covering the columns `[lesson_id,order]` on the table `lesson_question_map` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "lesson_question_map_lesson_id_order_key" ON "public"."lesson_question_map"("lesson_id", "order");
