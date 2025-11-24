-- CreateEnum
CREATE TYPE "ArcadeGameName" AS ENUM ('TURRET_DEFENSE', 'FLAPPY_BIRD', 'CITY_DRIVER');

-- CreateTable
CREATE TABLE "arcade_high_score" (
    "arcade_high_score_id" SERIAL NOT NULL,
    "arcade_game_name" "ArcadeGameName" NOT NULL,
    "score" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arcade_high_score_pkey" PRIMARY KEY ("arcade_high_score_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arcade_high_score_user_id_key" ON "arcade_high_score"("user_id");

-- AddForeignKey
ALTER TABLE "arcade_high_score" ADD CONSTRAINT "arcade_high_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
