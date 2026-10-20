import { supabase } from "@/lib/supabase";

/**
 * Determines which onboarding screen to show next based on what data exists
 * Returns the route to navigate to, or null if onboarding is complete
 */
export async function getNextOnboardingScreen(
  userId: string,
): Promise<string | null> {
  try {
    console.log(
      "🔍 Checking which onboarding screens are needed for user:",
      userId,
    );

    // Check all 6 required items (including deadline)
    const [notificationsRes, aspirationsRes, capsulesRes, userDataRes] =
      await Promise.all([
        (supabase.from("fcm_tokens") as any)
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
        (supabase.from("aspirations") as any)
          .select("id, deadline")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
        (supabase.from("time_capsules") as any)
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
        (supabase.from("users") as any)
          .select("avatar_url, better_self_avatar_url")
          .eq("id", userId)
          .limit(1)
          .maybeSingle(),
      ]);

    const hasNotifications = !!notificationsRes.data;
    const hasAspirations = !!aspirationsRes.data;
    const hasDeadline = !!aspirationsRes.data?.deadline;
    const hasTimeCapsules = !!capsulesRes.data;
    const hasAvatar = !!userDataRes.data?.avatar_url;
    const hasBetterSelfAvatar = !!userDataRes.data?.better_self_avatar_url;

    console.log("📋 Onboarding status:", {
      hasNotifications,
      hasAspirations,
      hasDeadline,
      hasTimeCapsules,
      hasAvatar,
      hasBetterSelfAvatar,
    });

    // Determine which screen to show next
    // Order: Notification → Aspiration → Deadline → Avatar Creation → Time Capsule → Home
    if (!hasNotifications) {
      console.log("➡️ Missing: FCM Token → Show notification-permission");
      return "/screens/onboarding/notification-permission";
    }

    if (!hasAspirations) {
      console.log("➡️ Missing: Aspiration → Show aspiration");
      return "/screens/onboarding/aspiration";
    }

    if (!hasDeadline) {
      console.log("➡️ Missing: Deadline → Show deadline");
      return "/screens/onboarding/deadline";
    }

    if (!hasAvatar) {
      console.log("➡️ Missing: Profile Avatar → Show avatar-creation");
      return "/screens/onboarding/avatar-creation";
    }

    if (!hasBetterSelfAvatar) {
      console.log("➡️ Missing: Better Self Avatar → Show avatar-creation");
      return "/screens/onboarding/avatar-creation";
    }

    if (!hasTimeCapsules) {
      console.log("➡️ Missing: Time Capsule → Show time-capsule");
      return "/screens/onboarding/time-capsule";
    }

    // All items exist
    console.log("✅ All onboarding items complete → Go to home");
    return null;
  } catch (error) {
    console.error("Error in getNextOnboardingScreen:", error);
    return "/screens/onboarding/notification-permission";
  }
}

/**
 * Gets the current onboarding step number (1-5) based on what's missing
 */
export async function getCurrentOnboardingStep(
  userId: string,
): Promise<number> {
  try {
    const [notificationsRes, aspirationsRes, capsulesRes, userDataRes] =
      await Promise.all([
        (supabase.from("fcm_tokens") as any)
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
        (supabase.from("aspirations") as any)
          .select("id, deadline")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
        (supabase.from("time_capsules") as any)
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
        (supabase.from("users") as any)
          .select("avatar_url, better_self_avatar_url")
          .eq("id", userId)
          .limit(1)
          .maybeSingle(),
      ]);

    const hasNotifications = !!notificationsRes.data;
    const hasAspirations = !!aspirationsRes.data;
    const hasDeadline = !!aspirationsRes.data?.deadline;
    const hasTimeCapsules = !!capsulesRes.data;
    const hasAvatar = !!userDataRes.data?.avatar_url;
    const hasBetterSelfAvatar = !!userDataRes.data?.better_self_avatar_url;

    if (!hasNotifications) return 1;
    if (!hasAspirations) return 2;
    if (!hasDeadline) return 3;
    if (!hasAvatar) return 4;
    if (!hasBetterSelfAvatar) return 5;
    if (!hasTimeCapsules) return 6;

    return 6; // All complete
  } catch (error) {
    console.error("Error in getCurrentOnboardingStep:", error);
    return 1;
  }
}
