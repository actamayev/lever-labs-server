-- Update sandbox_project table
UPDATE sandbox_project 
SET sandbox_json = replace(replace(replace(replace(
  sandbox_json::text, 
  'esp32_led_control', 'control_all_leds'), 
  'controls_repeat_ext', 'for_loop'), 
  'esp32_delay', 'delay'), 
  'esp32_loop', 'forever_loop')::jsonb
WHERE sandbox_json::text ~ '(esp32_led_control|controls_repeat_ext|esp32_delay|esp32_loop)';

-- Update challenge_sandbox table
UPDATE challenge_sandbox 
SET challenge_sandbox_json = replace(replace(replace(replace(
  challenge_sandbox_json::text, 
  'esp32_led_control', 'control_all_leds'), 
  'controls_repeat_ext', 'for_loop'), 
  'esp32_delay', 'delay'), 
  'esp32_loop', 'forever_loop')::jsonb
WHERE challenge_sandbox_json::text ~ '(esp32_led_control|controls_repeat_ext|esp32_delay|esp32_loop)';
