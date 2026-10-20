import { supabase } from "@/lib/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Called when a user updates their aspiration from the Edit Profile modal.
 * 1. Updates aspiration in DB
 * 2. Clears old goals, quiz sessions/questions/answers
 * 3. Regenerates goals
 * 4. Regenerates quiz questions
 * 5. Regenerates avatars
 * 6. Recalculates aspiration_progress
 */
export async function refreshOnAspirationUpdate(
  userId: string,
  newAspiration: string,
): Promise<void> {
  console.log("🔄 Aspiration updated — refreshing everything...");

  // 1. Update aspiration in DB
  await (supabase.from("aspirations") as any)
    .update({
      description: newAspiration,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "active");

  // 2. Delete old generated goals
  await (supabase.from("generated_goals") as any)
    .delete()
    .eq("user_id", userId);

  // 3. Delete old quiz sessions + questions + answers
  const { data: sessions } = await (supabase.from("goal_setup_sessions") as any)
    .select("id")
    .eq("user_id", userId);

  if (sessions && sessions.length > 0) {
    const ids = sessions.map((s: any) => s.id);
    await (supabase.from("goal_setup_answers") as any).delete().in("session_id", ids);
    await (supabase.from("goal_setup_questions") as any).delete().in("session_id", ids);
    await (supabase.from("goal_setup_sessions") as any).delete().eq("user_id", userId);
  }

  // 4. Delete old daily_goal_logs
  await (supabase.from("daily_goal_logs") as any).delete().eq("user_id", userId);

  // 5. Regenerate goals via edge function
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${SUPABASE_URL}/functions/v1/regenerate-daily-goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ userId }),
    });
    console.log("✅ Goals regenerated");
  } catch (err) {
    console.error("❌ Error regenerating goals:", err);
  }

  // 6. Regenerate avatars via edge function
  try {
    const { data: userData } = await (supabase.from("users") as any)
      .select("full_name")
      .eq("id", userId)
      .single();

    await fetch(`${SUPABASE_URL}/functions/v1/generate-avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        aspiration: newAspiration,
        userName: userData?.full_name || "User",
        regenerate: true,
      }),
    });
    console.log("✅ Avatars regenerated");
  } catch (err) {
    console.error("❌ Error regenerating avatars:", err);
  }

  // 7. Recalculate aspiration_progress
  try {
    const { recalculateAspirationProgress } = await import("./updateAspirationProgress");
    await recalculateAspirationProgress(userId);
    console.log("✅ Aspiration progress recalculated");
  } catch (err) {
    console.error("❌ Error recalculating progress:", err);
  }

  console.log("✅ Full refresh complete");
}
