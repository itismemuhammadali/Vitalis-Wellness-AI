-- ============================================
-- USER XP TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user_xp table
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own XP
CREATE POLICY "Users can view own XP"
ON public.user_xp
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create XP record
CREATE POLICY "Users can create XP record"
ON public.user_xp
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own XP (via backend only)
CREATE POLICY "Users can update own XP"
ON public.user_xp
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users cannot delete XP (data retention)
-- (No DELETE policy)

-- ============================================
-- USER XP TABLE POLICIES COMPLETE
-- ============================================
