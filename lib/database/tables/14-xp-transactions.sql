-- ============================================
-- XP TRANSACTIONS TABLE
-- ============================================
-- Audit trail of all XP earned/lost
-- Tracks reason for XP change
-- Used for analytics and debugging

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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);

-- Create index on goal_id for filtering
CREATE INDEX IF NOT EXISTS idx_xp_transactions_goal_id ON public.xp_transactions(goal_id);

-- Create index on transaction_type for filtering
CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON public.xp_transactions(transaction_type);

-- Create index on created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON public.xp_transactions(created_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_date ON public.xp_transactions(user_id, created_at DESC);

-- ============================================
-- XP TRANSACTIONS TABLE COMPLETE
-- ============================================
