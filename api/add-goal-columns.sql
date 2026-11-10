USE english_learning;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS daily_word_goal INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS daily_listening_goal INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS daily_reading_goal INT DEFAULT 3;