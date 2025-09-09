-- Update sandbox_project table
UPDATE sandbox_project 
SET sandbox_json = replace(
  sandbox_json::text, 
  'delay', 'wait')::jsonb
WHERE sandbox_json::text ~ '(delay)';

-- Update challenge_sandbox table
UPDATE challenge_sandbox 
SET challenge_sandbox_json = replace(
  challenge_sandbox_json::text, 
  'delay', 'wait')::jsonb
WHERE challenge_sandbox_json::text ~ '(delay)';
