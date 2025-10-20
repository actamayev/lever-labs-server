/*
  Warnings:

  - You are about to drop the column `sandbox_project_id` on the `sandbox_chat` table. All the data in the column will be lost.
  - The primary key for the `sandbox_project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sandbox_project_id` on the `sandbox_project` table. All the data in the column will be lost.
  - Added the required column `project_uuid` to the `sandbox_chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."sandbox_chat" DROP CONSTRAINT "sandbox_chat_sandbox_project_id_fkey";

-- DropIndex
DROP INDEX "public"."sandbox_project__project_uuid_idx";

-- DropIndex
DROP INDEX "public"."sandbox_project_project_uuid_key";

-- AlterTable
ALTER TABLE "sandbox_chat" DROP COLUMN "sandbox_project_id",
ADD COLUMN     "project_uuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sandbox_project" DROP CONSTRAINT "sandbox_project_pkey",
DROP COLUMN "sandbox_project_id",
ADD CONSTRAINT "sandbox_project_pkey" PRIMARY KEY ("project_uuid");

-- AddForeignKey
ALTER TABLE "sandbox_chat" ADD CONSTRAINT "sandbox_chat_project_uuid_fkey" FOREIGN KEY ("project_uuid") REFERENCES "sandbox_project"("project_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
