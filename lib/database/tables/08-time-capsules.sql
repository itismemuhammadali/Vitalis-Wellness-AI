-- ============================================
-- TIME CAPSULES TABLE
-- ============================================
-- Messages to future self
-- Can be text, voice, or video
-- Unlocks on specified date

CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  message_url TEXT,
  message_text TEXT,
  unlock_date DATE NOT NULL,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON public.time_capsules(user_id);

-- Create index on unlock_date for filtering
CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_date ON public.time_capsules(unlock_date);

-- Create index on is_unlocked for filtering
CREATE INDEX IF NOT EXISTS idx_time_capsules_is_unlocked ON public.time_capsules(is_unlocked);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_unlocked ON public.time_capsules(user_id, is_unlocked);

-- ============================================
-- TIME CAPSULES TABLE COMPLETE
-- ============================================
