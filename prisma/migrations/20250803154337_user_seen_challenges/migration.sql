-- CreateTable
CREATE TABLE "user_seen_challenges" (
    "user_seen_challenge_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_seen_challenges_pkey" PRIMARY KEY ("user_seen_challenge_id")
);

-- CreateIndex
CREATE INDEX "user_seen_challenges_user_id_idx" ON "user_seen_challenges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_seen_challenges_user_id_challenge_id_key" ON "user_seen_challenges"("user_id", "challenge_id");

-- AddForeignKey
ALTER TABLE "user_seen_challenges" ADD CONSTRAINT "user_seen_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_seen_challenges" ADD CONSTRAINT "user_seen_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;
