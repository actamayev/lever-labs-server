-- SELECT * FROM credentials where auth_method = 'google'; 
-- SELECT * FROM login_history;
-- SELECT * FROM pip_uuid;
-- SELECT * FROM user_pip_uuid_map;
-- SELECT * FROM activity ORDER BY activity_id;
-- SELECT * FROM reading_question ORDER BY reading_question_id;
-- SELECT * FROM reading_question_answer_choice ORDER BY reading_question_answer_choice_id;
-- SELECT * FROM career_quest_message;
-- SELECT * FROM career_user_progress;
-- SELECT * FROM teacher;
-- SELECT * FROM student;
-- DELETE FROM sandbox_message;
-- SELECT * FROM challenge_sandbox;
-- UPDATE challenge_sandbox 
-- SET challenge_sandbox_json = replace(challenge_sandbox_json::text, 'esp32_led_control', 'control_all_leds')::jsonb
-- WHERE challenge_sandbox_json::text LIKE '%esp32_led_control%';

-- SELECT COUNT(*) FROM challenge_sandbox 
-- WHERE challenge_sandbox_json::text ~ '(esp32_led_control|controls_repeat_ext|esp32_delay|esp32_loop)';


-- DELETE FROM career_quest_message;
-- DELETE FROM career_quest_chat;	
-- DELETE FROM career_quest_code_submission;
-- DELETE FROM career_quest_hint;
-- DELETE FROM career_quest_sandbox;
-- DELETE FROM career_user_progress;
-- DELETE FROM user_seen_challenges;

-- SELECT * FROM challenge_sandbox;
-- DELETE FROM activity;
-- DELETE FROM sandbox_project;
-- DELETE FROM credentials
-- WHERE user_id IN (11, 17, 27, 60);

-- SELECT * FROM _prisma_migrations;
