-- SELECT * FROM credentials ORDER BY created_at;
-- Select * from login_history;
-- SELECT * FROM profile_picture;
-- SELECT * FROM pip_uuid;
-- SELECT * FROM career_quest_message;
SELECT * FROM email_update_subscriber order by created_at;
-- SELECT * FROM teacher;
-- SELECT * FROM student;
-- SELECT * FROM challenge ORDER BY created_at;
-- SELECT * FROM sandbox_project ORDER BY updated_at;

-- SELECT * FROM pip_uuid ORDER BY created_at;

-- SELECT *
-- FROM pip_uuid
-- WHERE uuid ~ '[0Ooc1lIsS5zZ2B86bUVWwXxuvKkNG]'
-- ORDER BY pip_uuid_id;

-- SELECT * from profile_picture;
-- SELECT * FROM challenge_sandbox;

-- SELECT * FROM _prisma_migrations;

-- SELECT * FROM coding_block ORDER BY coding_block_id;
-- SELECT * FROM block_to_function_user_answer;
-- SELECT * FROM function_to_block_user_answer;
-- SELECT * FROM function_to_block_flashcard where question_id = '336d9cd0-7971-46b6-855f-414ce0d5fc35';

-- DELETE FROM function_to_block_user_answer where function_to_block_answer_choice_id = 81;
-- SELECT * FROM function_to_block_user_answer where function_to_block_answer_choice_id = 79;
-- SELECT * FROM function_to_block_answer_choice;
-- SELECT * FROM block_to_function_user_answer;
-- SELECT * FROM function_to_block_answer_choice;
-- SELECT * FROM completed_user_lesson;

-- SELECT * FROM block_to_function_flashcard;
-- SELECT * FROM function_to_block_flashcard;
-- SELECT * FROM fill_in_the_blank;
-- SELECT * FROM fill_in_the_blank_block_bank ORDER BY fill_in_the_blank_block_bank_id;
-- SELECT * FROM fill_in_the_blank_user_answer;
-- SELECT * FROM challenge_sandbox
-- ORDER BY created_at;
-- SELECT * FROM question where question_id = '336d9cd0-7971-46b6-855f-414ce0d5fc35';

-- SELECT * FROM action_to_code_multiple_choice_question;
-- SELECT * FROM action_to_code_multiple_choice_answer_choice;
-- SELECT * FROM action_to_code_multiple_choice_user_answer;

-- SELECT * FROM action_to_code_open_ended_question;
-- SELECT * FROM action_to_code_open_ended_question_block_bank;
-- SELECT * FROM action_to_code_open_ended_question_user_answer;
