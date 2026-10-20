-- ============================================
-- BETTER SELF AVATARS TABLE
-- ============================================
-- AI-generated avatars showing user's transformation
-- Multiple avatars per user at different progress levels
-- Stores historical record of avatar evolution

CREATE TABLE IF NOT EXISTS public.better_self_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  avatar_url TEXT NOT NULL,
  progress_percentage INTEGER NOT NULL,
  prompt TEXT,
  model TEXT DEFAULT 'dall-e-3',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_user_id ON public.better_self_avatars(user_id);

-- Create index on goal_id for filtering
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_goal_id ON public.better_self_avatars(goal_id);

-- Create index on progress_percentage for sorting
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_progress ON public.better_self_avatars(progress_percentage);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_user_progress ON public.better_self_avatars(user_id, progress_percentage);

-- ============================================
-- BETTER SELF AVATARS TABLE COMPLETE
-- ============================================
