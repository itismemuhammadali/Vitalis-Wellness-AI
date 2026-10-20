-- ============================================
-- ASPIRATIONS TABLE
-- ============================================
-- User's main goal/aspiration
-- One aspiration per user (UNIQUE constraint)
-- Includes timeline for calculating daily targets

CREATE TABLE IF NOT EXISTS public.aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  deadline TEXT,
  deadline_days INTEGER,
  status TEXT DEFAULT 'active',
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_aspirations_user_id ON public.aspirations(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_aspirations_status ON public.aspirations(status);

-- ============================================
-- ASPIRATIONS TABLE COMPLETE
-- ============================================
