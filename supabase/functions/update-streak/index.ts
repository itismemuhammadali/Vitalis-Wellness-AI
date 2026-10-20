// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface RequestBody {
  userId: string
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }

  try {
    const body: RequestBody = await req.json()

    if (!body.userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log("🔥 Updating streak for user:", body.userId)

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]

    // Check if ALL goals for today are completed
    console.log("📊 Checking if all goals are completed for today...")
    
    // Get all active goals (both generated and custom)
    const { data: generatedGoals, error: generatedError } = await supabase
      .from("generated_goals")
      .select("id")
      .eq("user_id", body.userId)
      .eq("status", "active")
      .eq("generated_date", today)

    const { data: customGoals, error: customError } = await supabase
      .from("custom_goals")
      .select("id, completion_percentage")
      .eq("user_id", body.userId)
      .eq("status", "active")

    if (generatedError || customError) {
      console.error("❌ Error fetching goals:", generatedError || customError)
      return new Response(
        JSON.stringify({ error: "Failed to fetch goals" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const generatedGoalIds = (generatedGoals || []).map(g => g.id)
    const customGoalsList = customGoals || []

    // Check if user has ANY goals at all
    if (generatedGoalIds.length === 0 && customGoalsList.length === 0) {
      console.log("⚠️ No goals found for today")
      return new Response(
        JSON.stringify({
          success: false,
          message: "No goals found for today",
          allGoalsCompleted: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check custom goals - they must ALL be 100% complete
    const hasCustomGoals = customGoalsList.length > 0
    const customGoalsComplete = hasCustomGoals 
      ? customGoalsList.every(g => g.completion_percentage === 100)
      : true // If no custom goals, consider them "complete"
    
    if (!customGoalsComplete) {
      console.log("⚠️ Not all custom goals are completed yet")
      console.log("  Custom Goals:", customGoalsList.length)
      console.log("  Completed Custom Goals:", customGoalsList.filter(g => g.completion_percentage === 100).length)
      return new Response(
        JSON.stringify({
          success: false,
          message: "Not all goals completed yet",
          allGoalsCompleted: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check generated goals completion
    let generatedGoalsComplete = true
    
    if (generatedGoalIds.length > 0) {
      // Get today's logs for generated goals
      const { data: logs, error: logsError } = await supabase
        .from("daily_goal_logs")
        .select("goal_id, status, completion_percentage")
        .eq("user_id", body.userId)
        .eq("log_date", today)
        .in("goal_id", generatedGoalIds)

      if (logsError) {
        console.error("❌ Error fetching logs:", logsError)
        return new Response(
          JSON.stringify({ error: "Failed to fetch logs" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }

      // Check if all generated goals are completed (100%)
      const completedGoalIds = (logs || [])
        .filter(log => log.completion_percentage === 100)
        .map(log => log.goal_id)

      generatedGoalsComplete = generatedGoalIds.every(id => completedGoalIds.includes(id))

      console.log("📊 Generated Goals Completion Status:")
      console.log("  Total Generated Goals:", generatedGoalIds.length)
      console.log("  Completed Generated Goals:", completedGoalIds.length)
      console.log("  All Generated Goals Completed:", generatedGoalsComplete)
    }

    // Final check: both generated and custom goals must be complete
    const allGoalsCompleted = generatedGoalsComplete && customGoalsComplete

    console.log("📊 Overall Completion Status:")
    console.log("  Generated Goals Complete:", generatedGoalsComplete)
    console.log("  Custom Goals Complete:", customGoalsComplete)
    console.log("  ALL Goals Complete:", allGoalsCompleted)

    if (!allGoalsCompleted) {
      console.log("⚠️ Not all goals are completed yet")
      return new Response(
        JSON.stringify({
          success: false,
          message: "Not all goals completed yet",
          allGoalsCompleted: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get current streak data
    const { data: streakData, error: streakError } = await supabase
      .from("user_streak")
      .select("*")
      .eq("user_id", body.userId)
      .single()

    if (streakError) {
      console.log("⚠️ No existing streak record, creating new one...")
      // Create new streak record - first day with all goals completed
      const { data: newStreak, error: createError } = await supabase
        .from("user_streak")
        .insert({
          user_id: body.userId,
          current_streak: 1,
          longest_streak: 1,
          last_log_date: today,
        })
        .select()
        .single()

      if (createError) {
        console.error("❌ Error creating streak record:", createError)
        return new Response(
          JSON.stringify({ error: "Failed to create streak record" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }

      console.log("✅ Created new streak record - Day 1!")
      return new Response(
        JSON.stringify({
          success: true,
          currentStreak: 1,
          longestStreak: 1,
          lastLogDate: today,
          allGoalsCompleted: true,
          message: "Great! You completed all goals today. Day 1 streak!",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check if already counted today's streak
    if (streakData.last_log_date === today) {
      console.log("ℹ️ Streak already counted for today")
      return new Response(
        JSON.stringify({
          success: true,
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
          lastLogDate: today,
          allGoalsCompleted: true,
          message: `All goals completed! ${streakData.current_streak} day streak maintained!`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Calculate if streak continues
    const lastLogDate = new Date(streakData.last_log_date)
    const todayDate = new Date(today)
    lastLogDate.setHours(0, 0, 0, 0)
    todayDate.setHours(0, 0, 0, 0)

    const diffTime = todayDate.getTime() - lastLogDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // If logged yesterday or today, streak continues
    const streakContinues = diffDays <= 1
    const newStreak = streakContinues ? streakData.current_streak + 1 : 1
    const newLongest = Math.max(newStreak, streakData.longest_streak)

    console.log("📊 Streak Calculation:")
    console.log("  Days since last log:", diffDays)
    console.log("  Old Streak:", streakData.current_streak)
    console.log("  New Streak:", newStreak)
    console.log("  Longest Streak:", newLongest)

    // Update streak
    const { data: updatedStreak, error: updateError } = await supabase
      .from("user_streak")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_log_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", body.userId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error updating streak:", updateError)
      return new Response(
        JSON.stringify({ error: "Failed to update streak" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log("✅ Streak updated successfully")
    return new Response(
      JSON.stringify({
        success: true,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastLogDate: today,
        allGoalsCompleted: true,
        message: streakContinues 
          ? `Amazing! All goals completed. ${newStreak} day streak! 🔥`
          : `All goals completed today! Starting fresh with a 1 day streak!`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in update-streak:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
