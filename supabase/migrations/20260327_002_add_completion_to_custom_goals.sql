-- Add completion_percentage column to custom_goals table if it doesn't exist
ALTER TABLE custom_goals
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
