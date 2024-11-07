/*
  Warnings:

  - You are about to drop the column `pip_name` on the `user_pip_uuid_map` table. All the data in the column will be lost.
  - Added the required column `hardware_version` to the `pip_uuid` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pip_uuid" ADD COLUMN     "hardware_version" TEXT NOT NULL,
ADD COLUMN     "pip_name" TEXT;

-- AlterTable
ALTER TABLE "user_pip_uuid_map" DROP COLUMN "pip_name";
