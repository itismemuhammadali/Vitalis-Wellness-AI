-- ============================================
-- GOALS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own goals
CREATE POLICY "Users can view own goals"
ON public.goals
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create goals
CREATE POLICY "Users can create goals"
ON public.goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own goals
CREATE POLICY "Users can update own goals"
ON public.goals
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own goals
CREATE POLICY "Users can delete own goals"
ON public.goals
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- GOALS TABLE POLICIES COMPLETE
-- ============================================
