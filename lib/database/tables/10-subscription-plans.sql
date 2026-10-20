-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
-- Available subscription tiers
-- Stores plan configuration
-- Prices set to NULL for GTR (Go-To-Release)

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2),
  billing_period TEXT DEFAULT 'monthly',
  features JSONB,
  max_goals INTEGER,
  max_logs_per_day INTEGER,
  ai_questions_enabled BOOLEAN DEFAULT FALSE,
  avatar_generation_enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON public.subscription_plans(name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON public.subscription_plans(status);

-- ============================================
-- SUBSCRIPTION PLANS TABLE COMPLETE
-- ============================================
