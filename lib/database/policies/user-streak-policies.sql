-- ============================================
-- USER_STREAK TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user_streak table
ALTER TABLE public.user_streak ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own streak
CREATE POLICY "Users can view own user streak"
ON public.user_streak
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own streak record
CREATE POLICY "Users can create own user streak"
ON public.user_streak
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own streak
CREATE POLICY "Users can update own user streak"
ON public.user_streak
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own streak record (usually handled by CASCADE)
CREATE POLICY "Users can delete own user streak"
ON public.user_streak
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- USER_STREAK TABLE POLICIES COMPLETE
-- ============================================
