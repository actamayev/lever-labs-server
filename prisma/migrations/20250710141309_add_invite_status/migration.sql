-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "student" ADD COLUMN     "invitation_status" "InvitationStatus" NOT NULL DEFAULT 'PENDING';
