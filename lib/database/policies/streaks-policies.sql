-- ============================================
-- STREAKS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on streaks table
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own streaks
CREATE POLICY "Users can view own streaks"
ON public.streaks
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create streaks
CREATE POLICY "Users can create streaks"
ON public.streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own streaks
CREATE POLICY "Users can update own streaks"
ON public.streaks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own streaks
CREATE POLICY "Users can delete own streaks"
ON public.streaks
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STREAKS TABLE POLICIES COMPLETE
-- ============================================
