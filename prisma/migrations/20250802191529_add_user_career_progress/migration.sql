-- CreateTable
CREATE TABLE "career_user_progress" (
    "career_user_progress_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "career_id" INTEGER NOT NULL,
    "challenge_id_or_text_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_user_progress_pkey" PRIMARY KEY ("career_user_progress_id")
);

-- CreateIndex
CREATE INDEX "career_user_progress_user_id_career_id_challenge_id_or_text_idx" ON "career_user_progress"("user_id", "career_id", "challenge_id_or_text_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_user_progress_user_id_career_id_challenge_id_or_text_key" ON "career_user_progress"("user_id", "career_id", "challenge_id_or_text_id");

-- AddForeignKey
ALTER TABLE "career_user_progress" ADD CONSTRAINT "career_user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_user_progress" ADD CONSTRAINT "career_user_progress_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "career"("career_id") ON DELETE RESTRICT ON UPDATE CASCADE;
