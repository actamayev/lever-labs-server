-- AlterTable
ALTER TABLE "public"."student" ADD COLUMN     "garage_driving_allowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "garage_lights_allowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "garage_sounds_allowed" BOOLEAN NOT NULL DEFAULT true;
