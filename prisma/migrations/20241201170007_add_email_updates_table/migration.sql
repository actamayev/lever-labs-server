/*
  Warnings:

  - A unique constraint covering the columns `[email__encrypted]` on the table `credentials` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "email_update_subscriber" (
    "email_update_subscriber_id" SERIAL NOT NULL,
    "email__encrypted" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "email_update_subscriber_pkey" PRIMARY KEY ("email_update_subscriber_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_update_subscriber_email__encrypted_key" ON "email_update_subscriber"("email__encrypted");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_email__encrypted_key" ON "credentials"("email__encrypted");
