-- Change deadline column from DATE to TEXT to allow flexible deadline descriptions
ALTER TABLE aspirations
ALTER COLUMN deadline TYPE TEXT;
