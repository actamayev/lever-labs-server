/*
  Warnings:

  - You are about to drop the column `default_sidebar_state` on the `credentials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "credentials" DROP COLUMN "default_sidebar_state";

-- DropEnum
DROP TYPE "SidebarStates";
