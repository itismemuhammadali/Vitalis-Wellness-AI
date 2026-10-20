-- ============================================
-- BASELINE ANSWERS TABLE
-- ============================================
-- User's answers to AI-generated questions
-- Used to establish baseline and calculate targets
-- Multiple answers per goal

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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_baseline_answers_user_id ON public.baseline_answers(user_id);

-- Create index on goal_id for filtering
CREATE INDEX IF NOT EXISTS idx_baseline_answers_goal_id ON public.baseline_answers(goal_id);

-- Create index on question_type for filtering
CREATE INDEX IF NOT EXISTS idx_baseline_answers_question_type ON public.baseline_answers(question_type);

-- ============================================
-- BASELINE ANSWERS TABLE COMPLETE
-- ============================================
