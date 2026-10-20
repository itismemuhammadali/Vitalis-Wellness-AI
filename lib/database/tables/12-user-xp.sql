-- ============================================
-- USER XP TABLE
-- ============================================
-- Tracks user's XP (experience points)
-- One row per user
-- XP earned from logging, consistency, and achievements

CREATE TABLE IF NOT EXISTS public.user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level TEXT DEFAULT 'Beginner',
  level_progress INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  lifetime_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON public.user_xp(user_id);

-- Create index on current_level for filtering
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON public.user_xp(current_level);

-- Create index on total_xp for leaderboards
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON public.user_xp(total_xp DESC);

-- ============================================
-- USER XP TABLE COMPLETE
-- ============================================
