-- ============================================
-- USERS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (including newly signed up users) to insert their own profile
CREATE POLICY "Anyone can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users cannot delete their own profile (data retention)
-- (No DELETE policy - deletion handled by auth.users cascade)

-- ============================================
-- USERS TABLE POLICIES COMPLETE
-- ============================================
