-- Enable RLS for user_streak table
-- Resolution for Supabase security warning: "Table public.user_streak is public, but RLS has not been enabled."

-- Enable RLS
ALTER TABLE public.user_streak ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own user streak" ON public.user_streak;
DROP POLICY IF EXISTS "Users can create own user streak" ON public.user_streak;
DROP POLICY IF EXISTS "Users can update own user streak" ON public.user_streak;
DROP POLICY IF EXISTS "Users can delete own user streak" ON public.user_streak;

-- Create Policies
CREATE POLICY "Users can view own user streak"
ON public.user_streak
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own user streak"
ON public.user_streak
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user streak"
ON public.user_streak
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user streak"
ON public.user_streak
FOR DELETE
USING (auth.uid() = user_id);
