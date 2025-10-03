-- AddForeignKey
ALTER TABLE "public"."block_to_function_flashcard" ADD CONSTRAINT "block_to_function_flashcard_coding_block_id_fkey" FOREIGN KEY ("coding_block_id") REFERENCES "public"."coding_block"("coding_block_id") ON DELETE RESTRICT ON UPDATE CASCADE;
