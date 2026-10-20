import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Check if goals were already generated today
    const { data: todayGoals } = await supabase
      .from("generated_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("generated_date", today)
      .limit(1);

    if (todayGoals && todayGoals.length > 0) {
      console.log("Goals already generated for today");
      return new Response(
        JSON.stringify({ success: true, message: "Goals already generated today" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the generate-goals function with stage 5 (goal generation)
    // The function will handle all context fetching and goal generation
    const generateGoalsUrl = `${supabaseUrl}/functions/v1/generate-goals`;
    
    const generateGoalsResponse = await fetch(generateGoalsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        stage: 5  // Goal generation stage
      }),
    });

    if (!generateGoalsResponse.ok) {
      const error = await generateGoalsResponse.text();
      console.error("Error calling generate-goals:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate goals" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generateGoalsResult = await generateGoalsResponse.json();

    if (!generateGoalsResult.success || !generateGoalsResult.goals) {
      console.error("Invalid response from generate-goals:", generateGoalsResult);
      return new Response(
        JSON.stringify({ error: "Invalid response from goal generation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Archive yesterday's goals
    const { data: yesterdayGoals } = await supabase
      .from("generated_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("generated_date", yesterday);

    if (yesterdayGoals && yesterdayGoals.length > 0) {
      const yesterdayGoalIds = yesterdayGoals.map((g: any) => g.id);
      await supabase
        .from("generated_goals")
        .update({ status: "archived" })
        .in("id", yesterdayGoalIds);
    }

    // Insert new goals for today
    const goalsToInsert = generateGoalsResult.goals.map((goal: any, index: number) => ({
      user_id: userId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      difficulty: goal.difficulty || "medium",
      estimated_time: goal.estimatedTime || 30,
      aspiration: goal.aspiration,
      coaching: goal.coaching,
      status: "active",
      generated_date: today,
    }));

    const { error: insertError } = await supabase
      .from("generated_goals")
      .insert(goalsToInsert);

    if (insertError) {
      console.error("Error inserting goals:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save goals" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Goals regenerated successfully for", today);
    return new Response(
      JSON.stringify({ success: true, goalsCount: generateGoalsResult.goals.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Function error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
