// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// @ts-ignore - Deno global
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore - Deno global
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface RequestBody {
  userId: string;
  activityLogId: string;
  matchedGoals: Array<{
    goalId: string;
    completionPercentage: number;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Validate API keys
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();

    // Validate input
    if (!body.userId || !body.matchedGoals) {
      return new Response(
        JSON.stringify({
          error: "Missing userId or matchedGoals",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Log each matched goal
    for (const goal of body.matchedGoals) {
      // Check if log already exists for today
      const { data: existingLog } = await supabase
        .from("daily_goal_logs")
        .select("*")
        .eq("goal_id", goal.goalId)
        .eq("user_id", body.userId)
        .eq("log_date", today)
        .limit(1)
        .maybeSingle();

      if (existingLog) {
        // Update existing log
        await supabase
          .from("daily_goal_logs")
          .update({
            completion_percentage: Math.min(goal.completionPercentage, 100),
            status: goal.completionPercentage >= 100 ? "completed" : "partial",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLog.id);
      } else {
        // Insert new log
        await supabase.from("daily_goal_logs").insert({
          goal_id: goal.goalId,
          user_id: body.userId,
          log_date: today,
          status: goal.completionPercentage >= 100 ? "completed" : "partial",
          completion_percentage: Math.min(goal.completionPercentage, 100),
        });
      }
    }

    // Update activity log as logged
    await supabase
      .from("better_self_activity_logs")
      .update({
        logged_to_goals: true,
      })
      .eq("id", body.activityLogId);

    // Update aspiration progress
    const { data: aspirationData } = await supabase
      .from("aspirations")
      .select("id")
      .eq("user_id", body.userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (aspirationData) {
      // Get all completed goals for today
      const { data: todayLogs } = await supabase
        .from("daily_goal_logs")
        .select("*")
        .eq("user_id", body.userId)
        .eq("log_date", today);

      const completedCount =
        todayLogs?.filter((log: any) => log.status === "completed").length || 0;

      // Update aspiration progress
      const { data: progressData } = await supabase
        .from("aspiration_progress")
        .select("*")
        .eq("user_id", body.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progressData) {
        const newCompletedGoals =
          (progressData.completed_goals || 0) + completedCount;
        const newCompletionPercentage =
          progressData.total_goals > 0
            ? Math.round((newCompletedGoals / progressData.total_goals) * 100)
            : 0;

        await supabase
          .from("aspiration_progress")
          .update({
            completed_goals: newCompletedGoals,
            completion_percentage: newCompletionPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", progressData.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Activity logged successfully",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error in log-better-self-activity:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
