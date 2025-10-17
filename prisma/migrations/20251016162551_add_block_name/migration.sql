/*
  Warnings:

  - You are about to drop the column `coding_block_id` on the `fill_in_the_blank_block_bank` table. All the data in the column will be lost.
  - Added the required column `block_name_id` to the `fill_in_the_blank_block_bank` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."fill_in_the_blank_block_bank" DROP CONSTRAINT "fill_in_the_blank_block_bank_coding_block_id_fkey";

-- DropIndex
DROP INDEX "public"."fill_in_the_blank_block_bank_coding_block_id_idx";

-- AlterTable
ALTER TABLE "public"."fill_in_the_blank_block_bank" DROP COLUMN "coding_block_id",
ADD COLUMN     "block_name_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."block_name" (
    "block_name_id" SERIAL NOT NULL,
    "block_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_name_pkey" PRIMARY KEY ("block_name_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "block_name_block_name_key" ON "public"."block_name"("block_name");

-- CreateIndex
CREATE INDEX "fill_in_the_blank_block_bank_block_name_id_idx" ON "public"."fill_in_the_blank_block_bank"("block_name_id");

-- AddForeignKey
ALTER TABLE "public"."fill_in_the_blank_block_bank" ADD CONSTRAINT "fill_in_the_blank_block_bank_block_name_id_fkey" FOREIGN KEY ("block_name_id") REFERENCES "public"."block_name"("block_name_id") ON DELETE RESTRICT ON UPDATE CASCADE;
