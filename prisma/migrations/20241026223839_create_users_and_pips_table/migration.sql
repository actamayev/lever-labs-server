-- CreateEnum
CREATE TYPE "SiteThemes" AS ENUM ('light', 'dark');

-- CreateEnum
CREATE TYPE "AuthMethods" AS ENUM ('blue_dot', 'google');

-- CreateTable
CREATE TABLE "credentials" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "default_site_theme" "SiteThemes" NOT NULL,
    "auth_method" "AuthMethods" NOT NULL,
    "email__encrypted" TEXT NOT NULL,
    "profile_picture_id" INTEGER,
    "youtube_access_tokens_id" INTEGER,
    "channel_banner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "login_history_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("login_history_id")
);

-- CreateTable
CREATE TABLE "pip_uuid" (
    "pip_uuid_id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pip_uuid_pkey" PRIMARY KEY ("pip_uuid_id")
);

-- CreateTable
CREATE TABLE "user_pip_uuid_map" (
    "user_pip_uuid_map_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pip_uuid_id" INTEGER NOT NULL,
    "pip_name" TEXT NOT NULL,
    "last_connection_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pip_uuid_map_pkey" PRIMARY KEY ("user_pip_uuid_map_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credentials_username_key" ON "credentials"("username");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_profile_picture_id_key" ON "credentials"("profile_picture_id");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_youtube_access_tokens_id_key" ON "credentials"("youtube_access_tokens_id");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_channel_banner_id_key" ON "credentials"("channel_banner_id");

-- CreateIndex
CREATE INDEX "credentials__profile_picture_id_idx" ON "credentials"("profile_picture_id");

-- CreateIndex
CREATE INDEX "credentials__channel_banner_id_idx" ON "credentials"("channel_banner_id");

-- CreateIndex
CREATE INDEX "credentials__youtube_access_tokens_id_idx" ON "credentials"("youtube_access_tokens_id");

-- CreateIndex
CREATE INDEX "login_history__user_id_idx" ON "login_history"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pip_uuid_uuid_key" ON "pip_uuid"("uuid");

-- CreateIndex
CREATE INDEX "user_pip_uuid_map__user_id_idx" ON "user_pip_uuid_map"("user_id");

-- CreateIndex
CREATE INDEX "user_pip_uuid_map__pip_uuid_id_idx" ON "user_pip_uuid_map"("pip_uuid_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_pip_uuid_map_user_id_pip_uuid_id_key" ON "user_pip_uuid_map"("user_id", "pip_uuid_id");

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pip_uuid_map" ADD CONSTRAINT "user_pip_uuid_map_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pip_uuid_map" ADD CONSTRAINT "user_pip_uuid_map_pip_uuid_id_fkey" FOREIGN KEY ("pip_uuid_id") REFERENCES "pip_uuid"("pip_uuid_id") ON DELETE RESTRICT ON UPDATE CASCADE;
