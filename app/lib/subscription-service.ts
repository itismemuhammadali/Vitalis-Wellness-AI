import { supabase } from "@/lib/supabase";

export type SubscriptionTier = "free" | "basic" | "premium";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  messageCount: number;
  messageLimit: number;
}

const MESSAGE_LIMITS = {
  free: 999999, // Unlimited until first goal is logged
  basic: 40, // 40 messages per day
  premium: 999999, // Unlimited
};

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  try {
    // Fetch subscription data
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError && subError.code !== "PGRST116") {
      console.error("Error fetching subscription:", subError);
    }

    // Determine tier
    let tier: SubscriptionTier = "free";
    let isActive = false;
    let expiresAt: string | null = null;

    if (subscription) {
      tier = subscription.subscription_tier || "free";
      expiresAt = subscription.expires_at;

      // Check if subscription is active
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        isActive = expiryDate > new Date();
      }

      // If expired, reset to free
      if (!isActive && tier !== "free") {
        await supabase
          .from("user_subscriptions")
          .update({ subscription_tier: "free", is_active: false })
          .eq("user_id", userId);
        tier = "free";
      }
    }

    // Get today's message count
    const today = new Date().toISOString().split("T")[0];
    const { count: messageCount } = await supabase
      .from("better_self_conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("sender", "user")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    return {
      tier,
      isActive: tier !== "free" ? isActive : true,
      expiresAt,
      messageCount: messageCount || 0,
      messageLimit: MESSAGE_LIMITS[tier],
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return {
      tier: "free",
      isActive: true,
      expiresAt: null,
      messageCount: 0,
      messageLimit: MESSAGE_LIMITS.free,
    };
  }
}

/**
 * Check if user can send a message
 */
export async function canSendMessage(userId: string): Promise<{
  canSend: boolean;
  reason?: string;
  messageCount: number;
  messageLimit: number;
  subscriptionTier: SubscriptionTier;
}> {
  const status = await getSubscriptionStatus(userId);
  
  // Special case: If user is on free tier and has seen first goal prompt, they must subscribe
  if (status.tier === "free") {
    const seenPrompt = await hasSeenFirstGoalPrompt(userId);
    if (seenPrompt) {
      return {
        canSend: false,
        reason: "must_subscribe_basic",
        messageCount: status.messageCount,
        messageLimit: status.messageLimit,
        subscriptionTier: status.tier,
      };
    }
  }

  if (status.messageCount >= status.messageLimit) {
    return {
      canSend: false,
      reason: status.tier === "basic" ? "upgrade_premium" : "daily_limit_reached",
      messageCount: status.messageCount,
      messageLimit: status.messageLimit,
      subscriptionTier: status.tier,
    };
  }

  return {
    canSend: true,
    messageCount: status.messageCount,
    messageLimit: status.messageLimit,
    subscriptionTier: status.tier,
  };
}

/**
 * Check if user has seen the first goal subscription prompt
 */
export async function hasSeenFirstGoalPrompt(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_preferences")
      .select("seen_first_goal_prompt")
      .eq("user_id", userId)
      .maybeSingle();

    return data?.seen_first_goal_prompt || false;
  } catch (error) {
    console.error("Error checking first goal prompt:", error);
    return false;
  }
}

/**
 * Mark first goal prompt as seen
 */
export async function markFirstGoalPromptSeen(userId: string): Promise<void> {
  try {
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, seen_first_goal_prompt: true },
        { onConflict: "user_id" }
      );
  } catch (error) {
    console.error("Error marking first goal prompt as seen:", error);
  }
}

/**
 * Activate subscription (called after successful purchase)
 */
export async function activateSubscription(
  userId: string,
  tier: "basic" | "premium",
  transactionId: string,
  platform: "ios" | "android"
): Promise<void> {
  try {
    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase.from("user_subscriptions").upsert(
      {
        user_id: userId,
        subscription_tier: tier,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        transaction_id: transactionId,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    console.log(`✅ Subscription activated: ${tier} for user ${userId}`);
  } catch (error) {
    console.error("Error activating subscription:", error);
    throw error;
  }
}
