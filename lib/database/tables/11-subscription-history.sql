-- ============================================
-- SUBSCRIPTION HISTORY TABLE
-- ============================================
-- Tracks user subscription changes
-- Historical record of all subscription events
-- Used for analytics and billing

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  event_type TEXT NOT NULL,
  previous_plan_id UUID REFERENCES public.subscription_plans(id),
  start_date DATE NOT NULL,
  end_date DATE,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);

-- Create index on plan_id for filtering
CREATE INDEX IF NOT EXISTS idx_subscription_history_plan_id ON public.subscription_history(plan_id);

-- Create index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON public.subscription_history(event_type);

-- Create index on start_date for date range queries
CREATE INDEX IF NOT EXISTS idx_subscription_history_start_date ON public.subscription_history(start_date);

-- ============================================
-- SUBSCRIPTION HISTORY TABLE COMPLETE
-- ============================================
