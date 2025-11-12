-- AlterTable
ALTER TABLE "coding_block" ADD COLUMN     "needs_manual_send_button" BOOLEAN,
ADD COLUMN     "on_click_cpp_to_run" TEXT,
ADD COLUMN     "on_release_cpp_to_run" TEXT;
