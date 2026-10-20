-- Link user_xp table to aspiration_progress table
-- This allows XP to be calculated based on completed_goals

ALTER TABLE user_xp
ADD COLUMN IF NOT EXISTS aspiration_progress_id UUID REFERENCES aspiration_progress(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_xp_aspiration_progress_id ON user_xp(aspiration_progress_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN user_xp.aspiration_progress_id IS 'Foreign key to aspiration_progress table. Used to calculate XP based on completed goals.';
