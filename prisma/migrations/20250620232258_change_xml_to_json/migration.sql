/*
  Warnings:

  - You are about to drop the column `sandbox_xml` on the `sandbox_project` table. All the data in the column will be lost.
  - Added the required column `sandbox_json` to the `sandbox_project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sandbox_project" DROP COLUMN "sandbox_xml",
ADD COLUMN     "sandbox_json" TEXT NOT NULL;
