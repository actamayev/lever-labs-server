/*
  Warnings:

  - The primary key for the `pip_uuid` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `pip_uuid_id` on the `pip_uuid` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."pip_uuid__uuid_idx";

-- DropIndex
DROP INDEX "public"."pip_uuid_uuid_key";

-- AlterTable
ALTER TABLE "pip_uuid" DROP CONSTRAINT "pip_uuid_pkey",
DROP COLUMN "pip_uuid_id",
ADD CONSTRAINT "pip_uuid_pkey" PRIMARY KEY ("uuid");
