import { supabase } from "@/lib/supabase";

export interface GoalWithProgress {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  deadline?: string;
  aspiration?: string;
  coaching?: string;
  todayStatus?: "completed" | "incomplete" | "partial" | "not_logged";
  todayCompletion?: number;
  todayNotes?: string;
}

export interface AspirationProgress {
  aspiration: string;
  totalGoals: number;
  completedGoals: number;
  completionPercentage: number;
}

// Get today's goals for a user (generated goals only - custom goals are handled separately)
export async function getTodayGoals(
  userId: string,
): Promise<GoalWithProgress[]> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // First, trigger daily goal regeneration
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const functionUrl =
        "https://aikobdjkiioxqiqtffyc.supabase.co/functions/v1/regenerate-daily-goals";

      await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || "anonymous"}`,
        },
        body: JSON.stringify({ userId }),
      });

      // After goals are regenerated, update aspiration_progress with total_goals
      console.log("📊 Updating aspiration_progress after goal generation...");
      const { updateAspirationProgressOnGoalGeneration } =
        await import("./updateAspirationProgress");
      await updateAspirationProgressOnGoalGeneration(userId, 5); // 5 goals generated per day
    } catch (regenerateError) {
      console.warn("Warning: Could not regenerate goals:", regenerateError);
      // Continue anyway - we'll show existing goals
    }

    // Get all active generated goals for today
    const { data: generatedGoals, error: generatedError } = await (
      supabase.from("generated_goals") as any
    )
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("generated_date", today);

    if (generatedError) {
      console.error("Error fetching generated goals:", generatedError);
    }

    if (!generatedGoals || generatedGoals.length === 0) {
      return [];
    }

    // Get today's logs for these goals
    const { data: logs, error: logsError } = await (
      supabase.from("daily_goal_logs") as any
    )
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today);

    if (logsError) {
      console.error("Error fetching logs:", logsError);
    }

    // Merge goals with today's logs
    const goalsWithProgress: GoalWithProgress[] = generatedGoals.map(
      (goal: any) => {
        const todayLog = logs?.find((log: any) => log.goal_id === goal.id);

        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          difficulty: goal.difficulty,
          estimatedTime: goal.estimated_time,
          deadline: goal.deadline,
          aspiration: goal.aspiration,
          coaching: goal.coaching,
          todayStatus: todayLog?.status || "not_logged",
          todayCompletion: todayLog?.completion_percentage || 0,
          todayNotes: todayLog?.notes || "",
        };
      },
    );

    return goalsWithProgress;
  } catch (error) {
    console.error("Error in getTodayGoals:", error);
    return [];
  }
}

// Get aspiration progress for user
export async function getAspirationProgress(
  userId: string,
): Promise<AspirationProgress[]> {
  try {
    const { data, error } = await (supabase.from("aspiration_progress") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching aspiration progress:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const progressData = data[0];
    return (
      progressData.aspirations?.map((aspiration: string, index: number) => ({
        aspiration,
        totalGoals: progressData.total_goals?.[index] || 0,
        completedGoals: progressData.completed_goals?.[index] || 0,
        completionPercentage: progressData.completion_percentages?.[index] || 0,
      })) || []
    );
  } catch (error) {
    console.error("Error in getAspirationProgress:", error);
    return [];
  }
}

// Calculate overall completion percentage
export async function getOverallCompletion(userId: string): Promise<number> {
  try {
    const { data: goals, error: goalsError } = await (
      supabase.from("generated_goals") as any
    )
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active");

    if (goalsError || !goals || goals.length === 0) {
      return 0;
    }

    const goalIds = goals.map((g: any) => g.id);

    const { data: logs, error: logsError } = await (
      supabase.from("daily_goal_logs") as any
    )
      .select("completion_percentage")
      .in("goal_id", goalIds)
      .eq("status", "completed");

    if (logsError || !logs) {
      return 0;
    }

    if (logs.length === 0) {
      return 0;
    }

    const totalCompletion = logs.reduce(
      (sum: number, log: any) => sum + (log.completion_percentage || 0),
      0,
    );
    return Math.round(totalCompletion / logs.length);
  } catch (error) {
    console.error("Error in getOverallCompletion:", error);
    return 0;
  }
}

// Log goal progress
export async function logGoalProgress(
  userId: string,
  goalId: string,
  status: "completed" | "incomplete" | "partial",
  completionPercentage: number,
  notes: string,
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if log exists for today
    const { data: existingLog, error: checkError } = await (
      supabase.from("daily_goal_logs") as any
    )
      .select("id")
      .eq("user_id", userId)
      .eq("goal_id", goalId)
      .eq("log_date", today)
      .single();

    if (existingLog) {
      // Update existing log
      const { error: updateError } = await (
        supabase.from("daily_goal_logs") as any
      )
        .update({
          status,
          completion_percentage: completionPercentage,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLog.id);

      if (updateError) {
        console.error("Error updating goal log:", updateError);
        return false;
      }
    } else {
      // Create new log
      const { error: insertError } = await (
        supabase.from("daily_goal_logs") as any
      ).insert({
        user_id: userId,
        goal_id: goalId,
        log_date: today,
        status,
        completion_percentage: completionPercentage,
        notes,
      });

      if (insertError) {
        console.error("Error creating goal log:", insertError);
        return false;
      }
    }

    console.log("✅ Goal progress logged");

    // Update aspiration_progress table (first row only)
    console.log("📊 Updating aspiration_progress table...");
    const { updateAspirationProgressOnCompletion } =
      await import("./updateAspirationProgress");
    await updateAspirationProgressOnCompletion(userId);

    return true;
  } catch (error) {
    console.error("Error in logGoalProgress:", error);
    return false;
  }
}

// Get user's latest session aspirations
export async function getUserAspirations(userId: string): Promise<string[]> {
  try {
    const { data, error } = await (supabase.from("goal_setup_sessions") as any)
      .select("aspirations")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching aspirations:", error);
      return [];
    }

    return data?.aspirations || [];
  } catch (error) {
    console.error("Error in getUserAspirations:", error);
    return [];
  }
}

// Get custom goals for a user
export async function getCustomGoals(
  userId: string,
): Promise<GoalWithProgress[]> {
  try {
    console.log("🔍 Fetching custom goals for user:", userId);

    const { data: customGoals, error } = await (
      supabase.from("custom_goals") as any
    )
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("deadline", { ascending: true });

    if (error) {
      console.error("❌ Error fetching custom goals:", error);
      return [];
    }

    console.log("✅ Custom goals from DB:", customGoals?.length, "goals");

    if (!customGoals || customGoals.length === 0) {
      console.log("⚠️ No custom goals found");
      return [];
    }

    const today = new Date().toISOString().split("T")[0];

    // First, handle any resets needed for goals from previous days
    const goalsNeedingReset = customGoals.filter((goal: any) => {
      const lastLoggedDate = goal.last_logged_date;
      return lastLoggedDate && lastLoggedDate !== today;
    });

    // Reset all goals that need it
    if (goalsNeedingReset.length > 0) {
      console.log(
        "🔄 Resetting",
        goalsNeedingReset.length,
        "goals for new day",
      );
      for (const goal of goalsNeedingReset) {
        await (supabase.from("custom_goals") as any)
          .update({
            completion_percentage: 0,
            last_logged_date: today,
          })
          .eq("id", goal.id);
      }
    }

    // Map custom goals with updated progress
    const goalsWithProgress: GoalWithProgress[] = customGoals.map(
      (goal: any) => {
        const lastLoggedDate = goal.last_logged_date;
        const shouldReset = lastLoggedDate && lastLoggedDate !== today;

        // If the date has changed, show 0% (it was just reset)
        const todayCompletion = shouldReset
          ? 0
          : goal.completion_percentage || 0;

        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          difficulty: goal.difficulty,
          estimatedTime: goal.estimated_time,
          deadline: goal.deadline,
          todayStatus: goal.status || "not_logged",
          todayCompletion: todayCompletion,
          todayNotes: goal.notes || "",
        };
      },
    );

    console.log(
      "✅ Final goals with progress:",
      goalsWithProgress.length,
      "goals",
    );

    return goalsWithProgress;
  } catch (error) {
    console.error("❌ Error in getCustomGoals:", error);
    return [];
  }
}
export async function createUserGoal(
  userId: string,
  title: string,
  description: string,
  category: string,
  deadline: string,
): Promise<boolean> {
  try {
    // Convert MM/DD/YYYY to YYYY-MM-DD format
    const [month, day, year] = deadline.split("/");
    const formattedDeadline = `${year}-${month}-${day}`;

    const { error } = await (supabase.from("custom_goals") as any).insert({
      user_id: userId,
      title,
      description,
      category,
      deadline: formattedDeadline,
      difficulty: "medium",
      estimated_time: 30,
      status: "active",
    });

    if (error) {
      console.error("Error creating goal:", error);
      return false;
    }

    console.log("✅ Custom goal created successfully");
    return true;
  } catch (error) {
    console.error("Error in createUserGoal:", error);
    return false;
  }
}
