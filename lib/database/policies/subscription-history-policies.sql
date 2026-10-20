-- ============================================
-- SUBSCRIPTION HISTORY TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on subscription_history table
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription history
CREATE POLICY "Users can view own subscription history"
ON public.subscription_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create subscription history (via trigger)
CREATE POLICY "Users can create subscription history"
ON public.subscription_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Only admins can update subscription history
-- (No policy - only service role can update)

-- Policy: Only admins can delete subscription history
-- (No policy - only service role can delete)

-- ============================================
-- SUBSCRIPTION HISTORY TABLE POLICIES COMPLETE
-- ============================================
