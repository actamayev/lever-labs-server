/*
  Warnings:

  - You are about to drop the column `order` on the `action_to_code_multiple_choice_answer_choice` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `block_to_function_answer_choice` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `function_to_block_answer_choice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "action_to_code_multiple_choice_answer_choice" DROP COLUMN "order";

-- AlterTable
ALTER TABLE "block_to_function_answer_choice" DROP COLUMN "order";

-- AlterTable
ALTER TABLE "function_to_block_answer_choice" DROP COLUMN "order";
