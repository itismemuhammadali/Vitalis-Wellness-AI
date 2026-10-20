-- ============================================
-- SETTINGS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
ON public.settings
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create settings
CREATE POLICY "Users can create settings"
ON public.settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
ON public.settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
ON public.settings
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- SETTINGS TABLE POLICIES COMPLETE
-- ============================================
