-- ============================================
-- SUBSCRIPTION PLANS TABLE - ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active subscription plans
CREATE POLICY "Everyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (status = 'active');

-- Policy: Only admins can create subscription plans
-- (No policy - only service role can insert)

-- Policy: Only admins can update subscription plans
-- (No policy - only service role can update)

-- Policy: Only admins can delete subscription plans
-- (No policy - only service role can delete)

-- ============================================
-- SUBSCRIPTION PLANS TABLE POLICIES COMPLETE
-- ============================================
