/*
  Warnings:

  - You are about to drop the column `teacher_name` on the `teacher` table. All the data in the column will be lost.
  - Added the required column `school_id` to the `teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_first_name` to the `teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_last_name` to the `teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teacher" DROP COLUMN "teacher_name",
ADD COLUMN     "school_id" INTEGER NOT NULL,
ADD COLUMN     "teacher_first_name" TEXT NOT NULL,
ADD COLUMN     "teacher_last_name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "school" (
    "school_id" SERIAL NOT NULL,
    "school_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_pkey" PRIMARY KEY ("school_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_school_name_key" ON "school"("school_name");

-- CreateIndex
CREATE INDEX "teacher__school_id_idx" ON "teacher"("school_id");

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
