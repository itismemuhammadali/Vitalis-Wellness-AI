import { supabase } from "../../lib/supabase";

/**
 * Parses a deadline string like "6 months", "1 year", "90 days", "3 weeks"
 * and returns the number of days from today to that deadline.
 */
function parseDeadlineToDays(deadline: string): number {
  const lower = deadline.toLowerCase().trim();
  const num = parseFloat(lower);
  if (isNaN(num)) return 90; // fallback

  if (lower.includes("year")) return Math.round(num * 365);
  if (lower.includes("month")) return Math.round(num * 30);
  if (lower.includes("week")) return Math.round(num * 7);
  if (lower.includes("day")) return Math.round(num);

  return 90; // fallback
}

/**
 * Ensures deadline_days is calculated and stored in aspirations table.
 * If already set and > 0, skips. Otherwise calculates from deadline text.
 */
async function ensureDeadlineDays(userId: string): Promise<number> {
  const { data: aspiration } = await (supabase.from("aspirations") as any)
    .select("id, deadline, deadline_days")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!aspiration) return 0;

  // Already calculated
  if (aspiration.deadline_days && aspiration.deadline_days > 0) {
    return aspiration.deadline_days;
  }

  // Can't calculate without deadline text
  if (!aspiration.deadline) return 0;

  const days = parseDeadlineToDays(aspiration.deadline);
  if (days <= 0) return 0;

  await (supabase.from("aspirations") as any)
    .update({ deadline_days: days, days_remaining: days })
    .eq("id", aspiration.id);

  console.log(`📅 Calculated deadline_days: ${days} from "${aspiration.deadline}"`);
  return days;
}

/**
 * Recalculates and upserts aspiration_progress for a user.
 *
 * total_goals     = deadline_days × 5
 * completed_goals = SUM(completion_percentage) / 100 across all daily_goal_logs
 * completion_pct  = (completed_goals / total_goals) × 100
 */
export async function recalculateAspirationProgress(userId: string): Promise<void> {
  try {
    console.log("📊 Recalculating aspiration progress for:", userId);

    // Step 1: ensure deadline_days is set
    const deadlineDays = await ensureDeadlineDays(userId);
    if (deadlineDays === 0) {
      console.log("⚠️ No deadline_days found, skipping progress update");
      return;
    }

    // Step 2: total_goals
    const totalGoals = deadlineDays * 5;

    // Step 3: completed_goals = SUM(completion_percentage) / 100
    const { data: logs } = await (supabase.from("daily_goal_logs") as any)
      .select("completion_percentage")
      .eq("user_id", userId);

    const sumPct = (logs || []).reduce(
      (acc: number, log: any) => acc + (parseFloat(log.completion_percentage) || 0),
      0,
    );
    const completedGoals = parseFloat((sumPct / 100).toFixed(2));

    // Step 4: completion_percentage
    const completionPercentage =
      totalGoals > 0
        ? Math.round((completedGoals / totalGoals) * 100)
        : 0;

    console.log(`🎯 total_goals=${totalGoals} | completed_goals=${completedGoals} | pct=${completionPercentage}%`);

    // Step 5: get aspiration description for the record
    const { data: aspiration } = await (supabase.from("aspirations") as any)
      .select("description")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    // Step 6: upsert aspiration_progress
    const { data: existing } = await (supabase.from("aspiration_progress") as any)
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    console.log("📝 Existing aspiration_progress row:", JSON.stringify(existing));

    if (existing) {
      const { error: updateErr } = await (supabase.from("aspiration_progress") as any)
        .update({
          total_goals: totalGoals,
          completed_goals: completedGoals,
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      console.log("📝 Update error:", updateErr?.message || "none");
    } else {
      const { error: insertErr } = await (supabase.from("aspiration_progress") as any).insert({
        user_id: userId,
        aspiration: aspiration?.description || "",
        total_goals: totalGoals,
        completed_goals: completedGoals,
        completion_percentage: completionPercentage,
      });
      console.log("📝 Insert error:", insertErr?.message || "none");
    }

    console.log("✅ aspiration_progress updated");
  } catch (err) {
    console.error("❌ Error in recalculateAspirationProgress:", err);
  }
}

/**
 * On app load: check if total_goals is missing/zero and fill it in.
 */
export async function ensureAspirationProgressInitialized(userId: string): Promise<void> {
  try {
    const { data: progress } = await (supabase.from("aspiration_progress") as any)
      .select("id, total_goals")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    console.log("🔍 aspiration_progress row:", JSON.stringify(progress));

    if (!progress || !progress.total_goals || progress.total_goals <= 0) {
      console.log("🔧 total_goals missing or zero — initializing...");
      await recalculateAspirationProgress(userId);

      // Verify it was saved
      const { data: after } = await (supabase.from("aspiration_progress") as any)
        .select("total_goals, completed_goals")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      console.log("✅ After recalculate:", JSON.stringify(after));
    } else {
      console.log(`✅ total_goals already set: ${progress.total_goals}`);
    }
  } catch (err) {
    console.error("❌ Error in ensureAspirationProgressInitialized:", err);
  }
}

// Keep old exports working so nothing else breaks
export const updateAspirationProgressOnGoalGeneration = async (userId: string) => {
  await recalculateAspirationProgress(userId);
};

export const updateAspirationProgressOnCompletion = async (userId: string) => {
  await recalculateAspirationProgress(userId);
};
