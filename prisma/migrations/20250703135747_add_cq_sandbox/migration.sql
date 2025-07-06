-- CreateTable
CREATE TABLE "career_quest_sandbox" (
    "career_quest_sandbox_id" SERIAL NOT NULL,
    "career_quest_sandbox_json" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "career_quest_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_quest_sandbox_pkey" PRIMARY KEY ("career_quest_sandbox_id")
);

-- CreateIndex
CREATE INDEX "career_quest_sandbox__user_id_idx" ON "career_quest_sandbox"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_quest_sandbox_user_id_career_quest_id_key" ON "career_quest_sandbox"("user_id", "career_quest_id");

-- AddForeignKey
ALTER TABLE "career_quest_sandbox" ADD CONSTRAINT "career_quest_sandbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
