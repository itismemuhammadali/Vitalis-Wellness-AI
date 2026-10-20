-- ============================================
-- BETTER SELF AVATARS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on better_self_avatars table
ALTER TABLE public.better_self_avatars ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own better self avatars
CREATE POLICY "Users can view own better self avatars"
ON public.better_self_avatars
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create better self avatars
CREATE POLICY "Users can create better self avatars"
ON public.better_self_avatars
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own better self avatars
CREATE POLICY "Users can update own better self avatars"
ON public.better_self_avatars
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own better self avatars
CREATE POLICY "Users can delete own better self avatars"
ON public.better_self_avatars
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- BETTER SELF AVATARS TABLE POLICIES COMPLETE
-- ============================================
