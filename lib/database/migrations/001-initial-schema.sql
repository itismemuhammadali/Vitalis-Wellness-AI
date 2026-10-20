-- ============================================
-- KYVO DATABASE - INITIAL SCHEMA MIGRATION
-- ============================================
-- Master migration file that creates entire database schema
-- Run this single file in Supabase SQL Editor to set up everything
-- Execution time: ~30 seconds

-- ============================================
-- STEP 1: INITIALIZATION
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

CREATE SCHEMA IF NOT EXISTS public;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  current_photo_url TEXT,
  better_self_avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- ASPIRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  deadline TEXT,
  deadline_days INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_aspirations_user_id ON public.aspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_aspirations_status ON public.aspirations(status);

-- GOALS TABLE
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

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_aspiration_id ON public.goals(aspiration_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(deadline);

-- BASELINE ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.baseline_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_type TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_answers_user_id ON public.baseline_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_baseline_answers_goal_id ON public.baseline_answers(goal_id);
CREATE INDEX IF NOT EXISTS idx_baseline_answers_question_type ON public.baseline_answers(question_type);

-- LOGS TABLE
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value DECIMAL(15,2) NOT NULL,
  note TEXT,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_goal_id ON public.logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_logs_log_date ON public.logs(log_date);
CREATE INDEX IF NOT EXISTS idx_logs_user_goal_date ON public.logs(user_id, goal_id, log_date);

-- STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_id)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_goal_id ON public.streaks(goal_id);
CREATE INDEX IF NOT EXISTS idx_streaks_current_streak ON public.streaks(current_streak);

-- BETTER SELF AVATARS TABLE
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

CREATE INDEX IF NOT EXISTS idx_better_self_avatars_user_id ON public.better_self_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_goal_id ON public.better_self_avatars(goal_id);
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_progress ON public.better_self_avatars(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_better_self_avatars_user_progress ON public.better_self_avatars(user_id, progress_percentage);

-- TIME CAPSULES TABLE
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

CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON public.time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_date ON public.time_capsules(unlock_date);
CREATE INDEX IF NOT EXISTS idx_time_capsules_is_unlocked ON public.time_capsules(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_unlocked ON public.time_capsules(user_id, is_unlocked);

-- SETTINGS TABLE
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

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_subscription_plan ON public.settings(subscription_plan);

-- SUBSCRIPTION PLANS TABLE
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

CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON public.subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON public.subscription_plans(status);

-- SUBSCRIPTION HISTORY TABLE
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

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_plan_id ON public.subscription_history(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON public.subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_start_date ON public.subscription_history(start_date);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baseline_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.better_self_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- USERS POLICIES
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ASPIRATIONS POLICIES
CREATE POLICY "Users can view own aspirations" ON public.aspirations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create aspirations" ON public.aspirations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own aspirations" ON public.aspirations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own aspirations" ON public.aspirations FOR DELETE USING (auth.uid() = user_id);

-- GOALS POLICIES
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- BASELINE ANSWERS POLICIES
CREATE POLICY "Users can view own baseline answers" ON public.baseline_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create baseline answers" ON public.baseline_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own baseline answers" ON public.baseline_answers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own baseline answers" ON public.baseline_answers FOR DELETE USING (auth.uid() = user_id);

-- LOGS POLICIES
CREATE POLICY "Users can view own logs" ON public.logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create logs" ON public.logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.logs FOR DELETE USING (auth.uid() = user_id);

-- STREAKS POLICIES
CREATE POLICY "Users can view own streaks" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create streaks" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.streaks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own streaks" ON public.streaks FOR DELETE USING (auth.uid() = user_id);

-- BETTER SELF AVATARS POLICIES
CREATE POLICY "Users can view own better self avatars" ON public.better_self_avatars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create better self avatars" ON public.better_self_avatars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own better self avatars" ON public.better_self_avatars FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own better self avatars" ON public.better_self_avatars FOR DELETE USING (auth.uid() = user_id);

-- TIME CAPSULES POLICIES
CREATE POLICY "Users can view own time capsules" ON public.time_capsules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create time capsules" ON public.time_capsules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time capsules" ON public.time_capsules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own time capsules" ON public.time_capsules FOR DELETE USING (auth.uid() = user_id);

-- SETTINGS POLICIES
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- SUBSCRIPTION PLANS POLICIES
CREATE POLICY "Everyone can view active subscription plans" ON public.subscription_plans FOR SELECT USING (status = 'active');

-- SUBSCRIPTION HISTORY POLICIES
CREATE POLICY "Users can view own subscription history" ON public.subscription_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscription history" ON public.subscription_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables created with indexes and RLS policies
-- Ready for data insertion
-- Execution time: ~30 seconds
