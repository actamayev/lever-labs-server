/*
  Warnings:

  - A unique constraint covering the columns `[teacher_id]` on the table `credentials` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvitationMethod" AS ENUM ('TEACHER_INVITE', 'CLASS_CODE');

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "teacher_id" INTEGER;

-- CreateTable
CREATE TABLE "classroom" (
    "classroom_id" SERIAL NOT NULL,
    "classroom_name" TEXT NOT NULL,
    "classroom_description" TEXT,
    "class_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_pkey" PRIMARY KEY ("classroom_id")
);

-- CreateTable
CREATE TABLE "teacher" (
    "teacher_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "classroom_teacher_map" (
    "classroom_teacher_map_id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "classroom_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_teacher_map_pkey" PRIMARY KEY ("classroom_teacher_map_id")
);

-- CreateTable
CREATE TABLE "student" (
    "student_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "classroom_id" INTEGER NOT NULL,
    "teacher_id_invited" INTEGER,
    "invitation_method" "InvitationMethod" NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classroom_class_code_key" ON "classroom"("class_code");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_user_id_key" ON "teacher"("user_id");

-- CreateIndex
CREATE INDEX "classroom_teacher_map_teacher_id_idx" ON "classroom_teacher_map"("teacher_id");

-- CreateIndex
CREATE INDEX "classroom_teacher_map_classroom_id_idx" ON "classroom_teacher_map"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_teacher_map_classroom_id_teacher_id_key" ON "classroom_teacher_map"("classroom_id", "teacher_id");

-- CreateIndex
CREATE INDEX "student_classroom_id_idx" ON "student"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_user_id_classroom_id_key" ON "student"("user_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_teacher_id_key" ON "credentials"("teacher_id");

-- CreateIndex
CREATE INDEX "credentials__teacher_id_idx" ON "credentials"("teacher_id");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher"("teacher_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_teacher_map" ADD CONSTRAINT "classroom_teacher_map_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher"("teacher_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_teacher_map" ADD CONSTRAINT "classroom_teacher_map_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("classroom_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("classroom_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_teacher_id_invited_fkey" FOREIGN KEY ("teacher_id_invited") REFERENCES "teacher"("teacher_id") ON DELETE SET NULL ON UPDATE CASCADE;
