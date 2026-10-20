-- ============================================
-- KYVO DATABASE - GAMIFICATION SCHEMA MIGRATION
-- ============================================
-- Adds gamification tables and updates existing tables
-- Run this AFTER 001-initial-schema.sql
-- Execution time: ~15 seconds

-- ============================================
-- STEP 1: UPDATE ASPIRATIONS TABLE
-- ============================================

-- Remove UNIQUE constraint to allow multiple aspirations per user
ALTER TABLE public.aspirations DROP CONSTRAINT IF EXISTS aspirations_user_id_key;

-- Add new columns for multiple aspirations support
ALTER TABLE public.aspirations 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- ============================================
-- STEP 2: UPDATE LOGS TABLE
-- ============================================

-- Add columns for custom activity logging and XP tracking
ALTER TABLE public.logs
ADD COLUMN IF NOT EXISTS activity_description TEXT,
ADD COLUMN IF NOT EXISTS activity_type TEXT,
ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;

-- ============================================
-- STEP 3: CREATE USER XP TABLE
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON public.user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON public.user_xp(current_level);
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON public.user_xp(total_xp DESC);

-- ============================================
-- STEP 4: CREATE ACHIEVEMENTS TABLE
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON public.achievements(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_achievements_user_unlocked ON public.achievements(user_id, is_unlocked);

-- ============================================
-- STEP 5: CREATE XP TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  xp_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  reason TEXT,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_goal_id ON public.xp_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON public.xp_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON public.xp_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_date ON public.xp_transactions(user_id, created_at DESC);

-- ============================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- USER XP POLICIES
CREATE POLICY "Users can view own XP" ON public.user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create XP record" ON public.user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own XP" ON public.user_xp FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ACHIEVEMENTS POLICIES
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.achievements FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- XP TRANSACTIONS POLICIES
CREATE POLICY "Users can view own XP transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create XP transactions" ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Gamification tables created
-- Aspirations table updated for multiple aspirations
-- Logs table updated for custom activity logging
-- All RLS policies enabled
-- Execution time: ~15 seconds
