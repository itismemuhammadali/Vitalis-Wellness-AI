-- Add deadline_days column to aspirations table to store the calculated number of days
ALTER TABLE aspirations
ADD COLUMN IF NOT EXISTS deadline_days INTEGER;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_aspirations_deadline_days ON aspirations(user_id, deadline_days);
