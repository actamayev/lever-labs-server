-- DropIndex
DROP INDEX "career_quest_chat_career_quest_id_user_id_key";

-- AlterTable
ALTER TABLE "career_quest_chat" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "career_quest_chat_career_quest_id_idx" ON "career_quest_chat"("career_quest_id");
