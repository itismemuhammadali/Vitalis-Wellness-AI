-- ============================================
-- ACHIEVEMENTS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on achievements table
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own achievements
CREATE POLICY "Users can view own achievements"
ON public.achievements
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create achievements (via backend only)
CREATE POLICY "Users can create achievements"
ON public.achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own achievements (via backend only)
CREATE POLICY "Users can update own achievements"
ON public.achievements
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users cannot delete achievements (data retention)
-- (No DELETE policy)

-- ============================================
-- ACHIEVEMENTS TABLE POLICIES COMPLETE
-- ============================================
