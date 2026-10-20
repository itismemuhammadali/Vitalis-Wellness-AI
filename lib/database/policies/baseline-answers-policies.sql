-- ============================================
-- BASELINE ANSWERS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on baseline_answers table
ALTER TABLE public.baseline_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own baseline answers
CREATE POLICY "Users can view own baseline answers"
ON public.baseline_answers
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create baseline answers
CREATE POLICY "Users can create baseline answers"
ON public.baseline_answers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own baseline answers
CREATE POLICY "Users can update own baseline answers"
ON public.baseline_answers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own baseline answers
CREATE POLICY "Users can delete own baseline answers"
ON public.baseline_answers
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- BASELINE ANSWERS TABLE POLICIES COMPLETE
-- ============================================
