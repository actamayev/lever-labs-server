/*
  Warnings:

  - You are about to drop the column `order` on the `fill_in_the_blank_block_bank` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `fill_in_the_blank_block_bank` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."fill_in_the_blank_block_bank" DROP COLUMN "order",
DROP COLUMN "quantity";
