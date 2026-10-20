// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface RequestBody {
  userId: string
  goalId: string
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

    if (!body.userId || !body.goalId) {
      return new Response(
        JSON.stringify({ error: "userId and goalId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log("🎯 Adding XP for goal completion - User:", body.userId, "Goal:", body.goalId)

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

    // Get aspiration_progress for this user to get completed_goals count
    const { data: progressData, error: progressError } = await supabase
      .from("aspiration_progress")
      .select("id, completed_goals")
      .eq("user_id", body.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single()

    if (progressError || !progressData) {
      console.error("❌ Error fetching aspiration_progress:", progressError)
      return new Response(
        JSON.stringify({ error: "No aspiration progress found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log("📊 Aspiration progress found:", { completedGoals: progressData.completed_goals })

    // Get current user XP
    const { data: userXp, error: xpError } = await supabase
      .from("user_xp")
      .select("*")
      .eq("user_id", body.userId)
      .single()

    console.log("📊 User XP query result:", { userXp, xpError })

    const XP_PER_GOAL = 5
    const XP_PER_LEVEL = 50

    if (xpError) {
      console.log("⚠️ No existing XP record, creating new one...")
      // Create new XP record if doesn't exist
      const { data: newXp, error: createError } = await supabase
        .from("user_xp")
        .insert({
          user_id: body.userId,
          aspiration_progress_id: progressData.id,
          total_xp: XP_PER_GOAL,
          current_level_number: 1,
          lifetime_xp: XP_PER_GOAL,
        })
        .select()
        .single()

      if (createError) {
        console.error("❌ Error creating user XP record:", createError)
        return new Response(
          JSON.stringify({ error: "Failed to create XP record" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }

      const newLevelNumber = Math.floor(XP_PER_GOAL / XP_PER_LEVEL) + 1
      const xpInCurrentLevel = XP_PER_GOAL % XP_PER_LEVEL
      const levelProgress = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)
      const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel

      console.log("✅ Created new XP record with", XP_PER_GOAL, "XP")
      return new Response(
        JSON.stringify({
          success: true,
          xpAdded: XP_PER_GOAL,
          totalXp: XP_PER_GOAL,
          currentLevel: newLevelNumber,
          levelProgress: levelProgress,
          xpToNextLevel: xpToNextLevel,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Update existing XP record - increment by 5 XP
    const newTotalXp = userXp.total_xp + XP_PER_GOAL
    const newLifetimeXp = userXp.lifetime_xp + XP_PER_GOAL
    const newLevelNumber = Math.floor(newTotalXp / XP_PER_LEVEL) + 1
    const xpInCurrentLevel = newTotalXp % XP_PER_LEVEL
    const levelProgress = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)
    const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel

    console.log("📊 XP Calculation:")
    console.log("  Old Total XP:", userXp.total_xp)
    console.log("  New Total XP:", newTotalXp)
    console.log("  New Level:", newLevelNumber)
    console.log("  Level Progress:", levelProgress)
    console.log("  XP to Next Level:", xpToNextLevel)

    // Update user XP
    const { data: updatedXp, error: updateError } = await supabase
      .from("user_xp")
      .update({
        total_xp: newTotalXp,
        lifetime_xp: newLifetimeXp,
        current_level_number: newLevelNumber,
        level_progress: levelProgress,
        xp_to_next_level: xpToNextLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", body.userId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error updating user XP:", updateError)
      return new Response(
        JSON.stringify({ error: "Failed to update XP" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check if user leveled up
    const leveledUp = newLevelNumber > userXp.current_level_number

    console.log("✅ XP updated successfully")
    return new Response(
      JSON.stringify({
        success: true,
        xpAdded: XP_PER_GOAL,
        totalXp: newTotalXp,
        currentLevel: newLevelNumber,
        levelProgress: levelProgress,
        xpToNextLevel: xpToNextLevel,
        leveledUp: leveledUp,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in add-goal-xp:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
