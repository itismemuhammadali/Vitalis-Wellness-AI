-- ============================================
-- GOALS TABLE
-- ============================================
-- Broken down goals from aspiration
-- Multiple goals per aspiration
-- Each goal has specific targets and deadlines

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  aspiration_id UUID NOT NULL REFERENCES public.aspirations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_value DECIMAL(15,2),
  current_value DECIMAL(15,2),
  target_value DECIMAL(15,2),
  unit TEXT,
  deadline DATE NOT NULL,
  status TEXT DEFAULT 'active',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- Create index on aspiration_id for filtering
CREATE INDEX IF NOT EXISTS idx_goals_aspiration_id ON public.goals(aspiration_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- Create index on deadline for sorting
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(deadline);

-- ============================================
-- GOALS TABLE COMPLETE
-- ============================================
