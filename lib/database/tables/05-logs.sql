-- ============================================
-- LOGS TABLE
-- ============================================
-- Daily progress entries
-- User logs their progress on each goal
-- Multiple logs per goal per day possible

CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value DECIMAL(15,2) NOT NULL,
  note TEXT,
  activity_description TEXT,
  activity_type TEXT,
  xp_earned INTEGER DEFAULT 0,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);

-- Create index on goal_id for filtering
CREATE INDEX IF NOT EXISTS idx_logs_goal_id ON public.logs(goal_id);

-- Create index on log_date for date range queries
CREATE INDEX IF NOT EXISTS idx_logs_log_date ON public.logs(log_date);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_logs_user_goal_date ON public.logs(user_id, goal_id, log_date);

-- ============================================
-- LOGS TABLE COMPLETE
-- ============================================
