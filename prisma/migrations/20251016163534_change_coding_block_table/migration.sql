/*
  Warnings:

  - You are about to drop the column `block_name` on the `coding_block` table. All the data in the column will be lost.
  - You are about to drop the column `color_sensor_detection_color` on the `coding_block` table. All the data in the column will be lost.
  - You are about to drop the column `led_color` on the `coding_block` table. All the data in the column will be lost.
  - You are about to drop the column `speaker_tone` on the `coding_block` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."coding_block" DROP COLUMN "block_name",
DROP COLUMN "color_sensor_detection_color",
DROP COLUMN "led_color",
DROP COLUMN "speaker_tone",
ADD COLUMN     "coding_block_json" JSONB NOT NULL DEFAULT '{}';
