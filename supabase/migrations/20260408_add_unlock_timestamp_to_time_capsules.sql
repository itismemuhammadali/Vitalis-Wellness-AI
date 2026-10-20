-- Add unlock_at timestamp column for precise countdown
ALTER TABLE public.time_capsules 
ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing unlock_date to unlock_at (set to start of day)
UPDATE public.time_capsules 
SET unlock_at = unlock_date::TIMESTAMP WITH TIME ZONE 
WHERE unlock_at IS NULL AND unlock_date IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_at ON public.time_capsules(unlock_at);
