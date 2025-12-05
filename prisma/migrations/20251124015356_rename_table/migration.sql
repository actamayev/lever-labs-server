/*
  Warnings:

  - You are about to drop the `arcade_high_score` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "arcade_high_score" DROP CONSTRAINT "arcade_high_score_user_id_fkey";

-- DropTable
DROP TABLE "arcade_high_score";

-- CreateTable
CREATE TABLE "arcade_score" (
    "arcade_score_id" SERIAL NOT NULL,
    "arcade_game_name" "ArcadeGameName" NOT NULL,
    "score" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arcade_score_pkey" PRIMARY KEY ("arcade_score_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arcade_score_user_id_key" ON "arcade_score"("user_id");

-- AddForeignKey
ALTER TABLE "arcade_score" ADD CONSTRAINT "arcade_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
