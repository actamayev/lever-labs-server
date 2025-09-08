/*
  Warnings:

  - You are about to drop the column `invitation_method` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_status` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `teacher_id_invited` on the `student` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."student" DROP CONSTRAINT "student_teacher_id_invited_fkey";

-- AlterTable
ALTER TABLE "public"."student" DROP COLUMN "invitation_method",
DROP COLUMN "invitation_status",
DROP COLUMN "teacher_id_invited";

-- DropEnum
DROP TYPE "public"."InvitationMethod";

-- DropEnum
DROP TYPE "public"."InvitationStatus";
