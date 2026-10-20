-- Add deadline column to aspirations table
ALTER TABLE aspirations
ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_aspirations_deadline ON aspirations(user_id, deadline);
