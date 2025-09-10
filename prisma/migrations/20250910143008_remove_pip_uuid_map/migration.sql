/*
  Warnings:

  - You are about to drop the `user_pip_uuid_map` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_pip_uuid_map" DROP CONSTRAINT "user_pip_uuid_map_pip_uuid_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_pip_uuid_map" DROP CONSTRAINT "user_pip_uuid_map_user_id_fkey";

-- DropTable
DROP TABLE "public"."user_pip_uuid_map";
