-- CreateEnum
CREATE TYPE "SidebarStates" AS ENUM ('expanded', 'collapsed');

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "default_sidebar_state" "SidebarStates" NOT NULL DEFAULT 'expanded';
