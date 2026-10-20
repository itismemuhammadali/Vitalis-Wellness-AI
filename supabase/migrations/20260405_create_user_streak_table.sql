-- Create user_streak table for tracking streaks
CREATE TABLE IF NOT EXISTS public.user_streak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_streak_user_id ON public.user_streak(user_id);

-- Add comment
COMMENT ON TABLE public.user_streak IS 'Tracks user streak data for gamification';
COMMENT ON COLUMN public.user_streak.current_streak IS 'Current consecutive days of activity';
COMMENT ON COLUMN public.user_streak.longest_streak IS 'Longest streak achieved';
COMMENT ON COLUMN public.user_streak.last_log_date IS 'Last date user logged activity';
