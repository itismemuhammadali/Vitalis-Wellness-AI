import { supabase } from "@/lib/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface MatchedGoal {
  goalId: string;
  goalTitle: string;
  goalTarget: string;
  userAchievement: string;
  completionPercentage: number;
  confidence: number;
  reasoning: string;
}

export interface DetectedActivity {
  description: string;
  matchedGoals: MatchedGoal[];
  unrelatedActivities: string[];
}

export interface BetterSelfResponse {
  message: string;
  detectedActivity?: DetectedActivity;
  followUpQuestions?: string[];
  suggestedActions?: Array<{
    type: "log_activity" | "celebrate" | "ask_clarification" | "provide_advice";
    content: string;
  }>;
}

export interface ConversationMessage {
  id: string;
  message_text: string;
  sender: "user" | "assistant";
  created_at: string;
  detected_activity?: DetectedActivity;
}

/**
 * Send a message to the Better Self chat
 */
export async function sendMessage(
  userId: string,
  userMessage: string,
): Promise<BetterSelfResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL not configured");
    }

    if (!SUPABASE_ANON_KEY) {
      throw new Error("Supabase anon key not configured");
    }

    const url = `${SUPABASE_URL}/functions/v1/better-self-chat`;
    console.log("Calling edge function:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        userMessage,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: BetterSelfResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Fetch conversation history
 */
export async function fetchConversationHistory(
  userId: string,
  limit: number = 50,
): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from("better_self_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).reverse();
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    throw error;
  }
}

/**
 * Log an activity to goals
 */
export async function logActivity(
  userId: string,
  activityLogId: string,
  matchedGoals: Array<{
    goalId: string;
    completionPercentage: number;
  }>,
): Promise<void> {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL not configured");
    }

    if (!SUPABASE_ANON_KEY) {
      throw new Error("Supabase anon key not configured");
    }

    const url = `${SUPABASE_URL}/functions/v1/log-better-self-activity`;
    console.log("Calling edge function:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        activityLogId,
        matchedGoals,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
}

/**
 * Get context data for display
 */
export async function getContextData(userId: string) {
  try {
    // Fetch user profile
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    // Fetch aspirations
    const { data: aspirationData } = await supabase
      .from("aspirations")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch today's goals
    const today = new Date().toISOString().split("T")[0];
    const { data: goals } = await supabase
      .from("generated_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    // Fetch aspiration progress
    const { data: progress } = await supabase
      .from("aspiration_progress")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      user,
      aspirations: aspirationData?.description || "",
      goals: goals || [],
      progress,
    };
  } catch (error) {
    console.error("Error getting context data:", error);
    throw error;
  }
}

/**
 * Get activity logs for a user
 */
export async function getActivityLogs(
  userId: string,
  limit: number = 20,
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("better_self_activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
}
