-- AlterTable
ALTER TABLE "teacher" ALTER COLUMN "is_approved" DROP NOT NULL,
ALTER COLUMN "is_approved" DROP DEFAULT;
