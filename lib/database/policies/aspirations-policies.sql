-- ============================================
-- ASPIRATIONS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on aspirations table
ALTER TABLE public.aspirations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own aspirations
CREATE POLICY "Users can view own aspirations"
ON public.aspirations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create aspirations
CREATE POLICY "Users can create aspirations"
ON public.aspirations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own aspirations
CREATE POLICY "Users can update own aspirations"
ON public.aspirations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own aspirations
CREATE POLICY "Users can delete own aspirations"
ON public.aspirations
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ASPIRATIONS TABLE POLICIES COMPLETE
-- ============================================
