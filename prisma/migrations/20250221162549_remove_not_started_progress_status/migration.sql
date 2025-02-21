/*
  Warnings:

  - The values [NOT_STARTED] on the enum `ProgressStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProgressStatus_new" AS ENUM ('IN_PROGRESS', 'COMPLETED');
ALTER TABLE "user_activity_progress" ALTER COLUMN "status" TYPE "ProgressStatus_new" USING ("status"::text::"ProgressStatus_new");
ALTER TYPE "ProgressStatus" RENAME TO "ProgressStatus_old";
ALTER TYPE "ProgressStatus_new" RENAME TO "ProgressStatus";
DROP TYPE "ProgressStatus_old";
COMMIT;
