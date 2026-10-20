-- ============================================
-- STREAKS TABLE
-- ============================================
-- Tracks user consistency on each goal
-- One row per user per goal
-- Updated daily when user logs progress

CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);

-- Create index on goal_id for filtering
CREATE INDEX IF NOT EXISTS idx_streaks_goal_id ON public.streaks(goal_id);

-- Create index on current_streak for sorting
CREATE INDEX IF NOT EXISTS idx_streaks_current_streak ON public.streaks(current_streak);

-- ============================================
-- STREAKS TABLE COMPLETE
-- ============================================
