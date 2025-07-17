-- CreateTable
CREATE TABLE "career_quest_code_submission" (
    "submission_id" SERIAL NOT NULL,
    "career_quest_chat_id" INTEGER NOT NULL,
    "user_code" TEXT NOT NULL,
    "challenge_snapshot" JSONB NOT NULL,
    "evaluation_result" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "model_used" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_quest_code_submission_pkey" PRIMARY KEY ("submission_id")
);

-- CreateIndex
CREATE INDEX "career_quest_code_submission_career_quest_chat_id_created_a_idx" ON "career_quest_code_submission"("career_quest_chat_id", "created_at");

-- AddForeignKey
ALTER TABLE "career_quest_code_submission" ADD CONSTRAINT "career_quest_code_submission_career_quest_chat_id_fkey" FOREIGN KEY ("career_quest_chat_id") REFERENCES "career_quest_chat"("career_quest_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;
