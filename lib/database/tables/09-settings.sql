-- ============================================
-- SETTINGS TABLE
-- ============================================
-- User preferences and API keys
-- One row per user
-- Stores encrypted API keys and settings

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  openai_api_key TEXT,
  notification_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME,
  daily_reminder_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- Create index on subscription_plan for filtering
CREATE INDEX IF NOT EXISTS idx_settings_subscription_plan ON public.settings(subscription_plan);

-- ============================================
-- SETTINGS TABLE COMPLETE
-- ============================================
