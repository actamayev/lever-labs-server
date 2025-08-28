/*
  Warnings:

  - You are about to drop the column `challenge_uuid_or_text_uuid` on the `career_user_progress` table. All the data in the column will be lost.
  - Added the required column `current_challenge_uuid_or_text_uuid` to the `career_user_progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `furthest_seen_challenge_uuid_or_text_uuid` to the `career_user_progress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "career_user_progress" DROP COLUMN "challenge_uuid_or_text_uuid",
ADD COLUMN     "current_challenge_uuid_or_text_uuid" TEXT NOT NULL,
ADD COLUMN     "furthest_seen_challenge_uuid_or_text_uuid" TEXT NOT NULL;
