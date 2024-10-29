/*
  Warnings:

  - You are about to drop the column `channel_banner_id` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `profile_picture_id` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `youtube_access_tokens_id` on the `credentials` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "credentials__channel_banner_id_idx";

-- DropIndex
DROP INDEX "credentials__profile_picture_id_idx";

-- DropIndex
DROP INDEX "credentials__youtube_access_tokens_id_idx";

-- DropIndex
DROP INDEX "credentials_channel_banner_id_key";

-- DropIndex
DROP INDEX "credentials_profile_picture_id_key";

-- DropIndex
DROP INDEX "credentials_youtube_access_tokens_id_key";

-- AlterTable
ALTER TABLE "credentials" DROP COLUMN "channel_banner_id",
DROP COLUMN "profile_picture_id",
DROP COLUMN "youtube_access_tokens_id";
