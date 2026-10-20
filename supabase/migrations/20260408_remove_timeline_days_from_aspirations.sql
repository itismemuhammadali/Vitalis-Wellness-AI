-- Remove timeline_days column from aspirations table
-- This column is being replaced by the deadline column for better deadline tracking

ALTER TABLE aspirations
DROP COLUMN IF EXISTS timeline_days;
