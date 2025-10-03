/*
  Warnings:

  - You are about to drop the column `delay_ms` on the `coding_block` table. All the data in the column will be lost.
  - You are about to drop the column `direction` on the `coding_block` table. All the data in the column will be lost.
  - You are about to drop the column `motor_speed` on the `coding_block` table. All the data in the column will be lost.
  - You are about to drop the column `speaker_sound` on the `coding_block` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."coding_block" DROP COLUMN "delay_ms",
DROP COLUMN "direction",
DROP COLUMN "motor_speed",
DROP COLUMN "speaker_sound",
ADD COLUMN     "speaker_tone" TEXT;
