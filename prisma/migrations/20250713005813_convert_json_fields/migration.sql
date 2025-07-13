-- Migration to convert String to Json for JSON fields

-- Step 1: Add temporary Json columns
ALTER TABLE "sandbox_project" ADD COLUMN "sandbox_json_temp" JSONB;
ALTER TABLE "career_quest_sandbox" ADD COLUMN "career_quest_sandbox_json_temp" JSONB;

-- Step 2: Migrate data with validation
-- This will fail if any existing data is invalid JSON
UPDATE "sandbox_project" 
SET "sandbox_json_temp" = "sandbox_json"::JSONB
WHERE "sandbox_json" IS NOT NULL;

UPDATE "career_quest_sandbox" 
SET "career_quest_sandbox_json_temp" = "career_quest_sandbox_json"::JSONB
WHERE "career_quest_sandbox_json" IS NOT NULL;

-- Step 3: Drop old String columns
ALTER TABLE "sandbox_project" DROP COLUMN "sandbox_json";
ALTER TABLE "career_quest_sandbox" DROP COLUMN "career_quest_sandbox_json";

-- Step 4: Rename temp columns to original names
ALTER TABLE "sandbox_project" RENAME COLUMN "sandbox_json_temp" TO "sandbox_json";
ALTER TABLE "career_quest_sandbox" RENAME COLUMN "career_quest_sandbox_json_temp" TO "career_quest_sandbox_json";

-- Step 5: Add NOT NULL constraints back
ALTER TABLE "sandbox_project" ALTER COLUMN "sandbox_json" SET NOT NULL;
ALTER TABLE "career_quest_sandbox" ALTER COLUMN "career_quest_sandbox_json" SET NOT NULL;
