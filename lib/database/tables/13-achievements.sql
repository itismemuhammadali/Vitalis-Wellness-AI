-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
-- Badges and milestones earned by users
-- Multiple achievements per user
-- Tracks achievement unlock date and progress

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_reward INTEGER DEFAULT 0,
  progress_value INTEGER DEFAULT 0,
  progress_target INTEGER DEFAULT 1,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);

-- Create index on achievement_type for filtering
CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.achievements(achievement_type);

-- Create index on is_unlocked for filtering
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON public.achievements(is_unlocked);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_achievements_user_unlocked ON public.achievements(user_id, is_unlocked);

-- ============================================
-- ACHIEVEMENTS TABLE COMPLETE
-- ============================================
