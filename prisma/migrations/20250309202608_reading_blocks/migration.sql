-- CreateTable
CREATE TABLE "reading_block" (
    "reading_block_id" SERIAL NOT NULL,
    "reading_id" INTEGER NOT NULL,
    "reading_block_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_block_pkey" PRIMARY KEY ("reading_block_id")
);

-- CreateTable
CREATE TABLE "completed_reading_block" (
    "completed_reading_block_id" SERIAL NOT NULL,
    "reading_block_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "completed_reading_block_pkey" PRIMARY KEY ("completed_reading_block_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reading_block_reading_block_name_key" ON "reading_block"("reading_block_name");

-- CreateIndex
CREATE INDEX "reading_block__reading_id_idx" ON "reading_block"("reading_id");

-- CreateIndex
CREATE INDEX "completed_reading_block__user_id_idx" ON "completed_reading_block"("user_id");

-- CreateIndex
CREATE INDEX "completed_reading_block__reading_block_id_idx" ON "completed_reading_block"("reading_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "completed_reading_block_user_id_reading_block_id_key" ON "completed_reading_block"("user_id", "reading_block_id");

-- AddForeignKey
ALTER TABLE "reading_block" ADD CONSTRAINT "reading_block_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_reading_block" ADD CONSTRAINT "completed_reading_block_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_reading_block" ADD CONSTRAINT "completed_reading_block_reading_block_id_fkey" FOREIGN KEY ("reading_block_id") REFERENCES "reading_block"("reading_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;
