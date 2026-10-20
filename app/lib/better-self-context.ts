import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  age?: number;
}

export interface TodayGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  targetValue?: string;
  targetUnit?: string;
  status: string;
  todayCompletion: number;
}

export interface AspirationProgress {
  aspiration: string;
  completedGoals: number;
  totalGoals: number;
  completionPercentage: number;
  daysRemaining: number;
  requiredPace: number;
  actualPace: number;
  status: string;
}

export interface RecentActivity {
  id: string;
  goalId: string;
  goalTitle: string;
  completionPercentage: number;
  logDate: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Get user profile
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, age")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}

/**
 * Get today's goals
 */
export async function getTodayGoals(userId: string): Promise<TodayGoal[]> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: goals, error: goalsError } = await supabase
      .from("generated_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (goalsError) {
      console.error("Error fetching goals:", goalsError);
      return [];
    }

    const todayGoals: TodayGoal[] = [];

    if (goals) {
      for (const goal of goals) {
        const { data: logs } = await supabase
          .from("daily_goal_logs")
          .select("*")
          .eq("goal_id", goal.id)
          .eq("log_date", today)
          .limit(1)
          .maybeSingle();

        todayGoals.push({
          id: goal.id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          difficulty: goal.difficulty,
          targetValue: extractTargetValue(goal.title),
          targetUnit: extractTargetUnit(goal.title),
          status: logs?.status || "not_logged",
          todayCompletion: logs?.completion_percentage || 0,
        });
      }
    }

    return todayGoals;
  } catch (error) {
    console.error("Error in getTodayGoals:", error);
    return [];
  }
}

/**
 * Get aspiration progress
 */
export async function getAspirationProgress(
  userId: string,
): Promise<AspirationProgress[]> {
  try {
    const { data, error } = await supabase
      .from("aspiration_progress")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching aspiration progress:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAspirationProgress:", error);
    return [];
  }
}

/**
 * Get recent activities (last 7 days)
 */
export async function getRecentActivities(
  userId: string,
): Promise<RecentActivity[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("daily_goal_logs")
      .select("id, goal_id, completion_percentage, log_date")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("log_date", { ascending: false });

    if (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }

    // Fetch goal titles for each activity
    const activities: RecentActivity[] = [];
    if (data) {
      for (const log of data) {
        const { data: goal } = await supabase
          .from("generated_goals")
          .select("title")
          .eq("id", log.goal_id)
          .single();

        if (goal) {
          activities.push({
            id: log.id,
            goalId: log.goal_id,
            goalTitle: goal.title,
            completionPercentage: log.completion_percentage,
            logDate: log.log_date,
          });
        }
      }
    }

    return activities;
  } catch (error) {
    console.error("Error in getRecentActivities:", error);
    return [];
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 20,
): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from("better_self_conversations")
      .select("message_text, sender")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }

    return (data || []).reverse().map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.message_text,
    }));
  } catch (error) {
    console.error("Error in getConversationHistory:", error);
    return [];
  }
}

/**
 * Helper: Extract target value from goal title
 */
function extractTargetValue(goalTitle: string): string | undefined {
  const match = goalTitle.match(/(\d+)\s*(pushups|pages|minutes|km|kg|hours)/i);
  return match ? match[1] : undefined;
}

/**
 * Helper: Extract target unit from goal title
 */
function extractTargetUnit(goalTitle: string): string | undefined {
  const match = goalTitle.match(/(\d+)\s*(pushups|pages|minutes|km|kg|hours)/i);
  return match ? match[2] : undefined;
}
