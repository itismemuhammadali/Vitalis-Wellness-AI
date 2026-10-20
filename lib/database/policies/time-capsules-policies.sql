-- ============================================
-- TIME CAPSULES TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on time_capsules table
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own time capsules
CREATE POLICY "Users can view own time capsules"
ON public.time_capsules
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create time capsules
CREATE POLICY "Users can create time capsules"
ON public.time_capsules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own time capsules
CREATE POLICY "Users can update own time capsules"
ON public.time_capsules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own time capsules
CREATE POLICY "Users can delete own time capsules"
ON public.time_capsules
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- TIME CAPSULES TABLE POLICIES COMPLETE
-- ============================================
