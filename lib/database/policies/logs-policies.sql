-- ============================================
-- LOGS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on logs table
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs"
ON public.logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create logs
CREATE POLICY "Users can create logs"
ON public.logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update own logs"
ON public.logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete own logs"
ON public.logs
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- LOGS TABLE POLICIES COMPLETE
-- ============================================
