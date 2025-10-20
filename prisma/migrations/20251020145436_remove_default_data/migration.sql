-- AlterTable
ALTER TABLE "block_name" ALTER COLUMN "block_name_id" DROP DEFAULT;
DROP SEQUENCE "block_name_block_name_id_seq";

-- AlterTable
ALTER TABLE "block_to_function_answer_choice" ALTER COLUMN "block_to_function_answer_choice_id" DROP DEFAULT;
DROP SEQUENCE "block_to_function_answer_choi_block_to_function_answer_choi_seq";

-- AlterTable
ALTER TABLE "block_to_function_flashcard" ALTER COLUMN "question_text" DROP DEFAULT;

-- AlterTable
ALTER TABLE "challenge" ALTER COLUMN "challenge_id" DROP DEFAULT;
DROP SEQUENCE "challenge_challenge_id_seq";

-- AlterTable
ALTER TABLE "coding_block" ALTER COLUMN "coding_block_id" DROP DEFAULT,
ALTER COLUMN "coding_block_json" DROP DEFAULT;
DROP SEQUENCE "coding_block_coding_block_id_seq";

-- AlterTable
ALTER TABLE "fill_in_the_blank_block_bank" ALTER COLUMN "fill_in_the_blank_block_bank_id" DROP DEFAULT;
DROP SEQUENCE "fill_in_the_blank_block_bank_fill_in_the_blank_block_bank_i_seq";

-- AlterTable
ALTER TABLE "function_to_block_answer_choice" ALTER COLUMN "function_to_block_answer_choice_id" DROP DEFAULT;
DROP SEQUENCE "function_to_block_answer_choi_function_to_block_answer_choi_seq";

-- AlterTable
ALTER TABLE "lesson_question_map" ALTER COLUMN "lesson_question_map_id" DROP DEFAULT;
DROP SEQUENCE "lesson_question_map_lesson_question_map_id_seq";
