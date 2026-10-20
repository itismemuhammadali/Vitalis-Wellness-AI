-- ============================================
-- XP TRANSACTIONS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on xp_transactions table
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own XP transactions
CREATE POLICY "Users can view own XP transactions"
ON public.xp_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create XP transactions (via backend only)
CREATE POLICY "Users can create XP transactions"
ON public.xp_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users cannot update XP transactions (audit trail)
-- (No UPDATE policy)

-- Policy: Users cannot delete XP transactions (audit trail)
-- (No DELETE policy)

-- ============================================
-- XP TRANSACTIONS TABLE POLICIES COMPLETE
-- ============================================
