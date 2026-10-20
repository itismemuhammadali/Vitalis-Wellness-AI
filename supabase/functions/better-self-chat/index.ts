// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// @ts-ignore - Deno global
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
// @ts-ignore - Deno global
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore - Deno global
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (!body.userId || !body.userMessage) {
      return new Response(JSON.stringify({ error: "Missing userId or userMessage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch context
    const [userRes, aspirationRes, goalsRes, historyRes] = await Promise.all([
      supabase.from("users").select("id").eq("id", body.userId).single(),
      supabase.from("aspirations").select("description").eq("user_id", body.userId).eq("status", "active").limit(1).maybeSingle(),
      supabase.from("generated_goals").select("id, title").eq("user_id", body.userId).eq("status", "active"),
      supabase.from("better_self_conversations").select("message_text, sender").eq("user_id", body.userId).order("created_at", { ascending: false }).limit(10),
    ]);

    if (userRes.error || !userRes.data) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aspirations = aspirationRes.data?.description || "";
    const goals = goalsRes.data || [];
    const history = (historyRes.data || []).reverse().map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.message_text,
    }));

    // --- STEP 1: Ask OpenAI to analyze the message and match goals ---
    const goalsJson = JSON.stringify(goals.map((g: any) => ({ id: g.id, title: g.title })));
    console.log("🎯 Goals for analysis:", goalsJson);
    console.log("💬 User message:", body.userMessage);

    const analysisPrompt = `You are an activity analyzer. The user has these goals:
${goalsJson}

The user just said: "${body.userMessage}"

Analyze if the user is reporting completing any of these goals (fully or partially).

IMPORTANT RULES:
- If the user says something like "completed all goals", "done all tasks", "finished everything today" — mark ALL goals as 100% complete.
- If the user mentions a specific goal by keyword, match it and calculate percentage.
- If a goal has multiple tasks (e.g. "30 push-ups AND 15 pull-ups"), only mark 100% if ALL tasks were done.
- If the user only did SOME tasks in a combined goal, calculate partial percentage.
- If the message is clearly not about completing any goal (e.g. just a question or greeting), return [].

Respond ONLY with a valid JSON array. No explanation, no markdown, just raw JSON.
Format: [{"goalId": "<id>", "completionPercentage": <0-100>}]
If no goals were completed, respond with: []`;

    const analysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    let matchedGoals: Array<{ goalId: string; completionPercentage: number }> = [];
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      const raw = analysisData.choices?.[0]?.message?.content?.trim() || "[]";
      console.log("🤖 Analysis raw response:", raw);
      try {
        matchedGoals = JSON.parse(raw);
        console.log("✅ Matched goals:", JSON.stringify(matchedGoals));
      } catch {
        console.error("Failed to parse goal analysis:", raw);
      }
    }

    // --- STEP 2: Write matched goals to daily_goal_logs + update aspiration_progress + streak ---
    if (matchedGoals.length > 0) {
      const today = new Date().toISOString().split("T")[0];

      for (const match of matchedGoals) {
        if (!match.goalId || match.completionPercentage == null) continue;
        const status = match.completionPercentage >= 100 ? "completed" : "partial";

        const { data: existing } = await supabase
          .from("daily_goal_logs")
          .select("id")
          .eq("goal_id", match.goalId)
          .eq("user_id", body.userId)
          .eq("log_date", today)
          .limit(1)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("daily_goal_logs")
            .update({
              completion_percentage: match.completionPercentage,
              daily_completion_percentage: match.completionPercentage,
              status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("daily_goal_logs").insert({
            goal_id: match.goalId,
            user_id: body.userId,
            log_date: today,
            status,
            completion_percentage: match.completionPercentage,
            daily_completion_percentage: match.completionPercentage,
          });
        }
      }

      // Recalculate aspiration_progress
      // Get deadline_days from aspirations
      const { data: aspiration } = await supabase
        .from("aspirations")
        .select("id, deadline, deadline_days, description")
        .eq("user_id", body.userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (aspiration) {
        let deadlineDays = aspiration.deadline_days || 0;

        // Calculate deadline_days if missing
        if (!deadlineDays || deadlineDays <= 0) {
          const dl = (aspiration.deadline || "").toLowerCase().trim();
          const num = parseFloat(dl);
          if (!isNaN(num)) {
            if (dl.includes("year")) deadlineDays = Math.round(num * 365);
            else if (dl.includes("month")) deadlineDays = Math.round(num * 30);
            else if (dl.includes("week")) deadlineDays = Math.round(num * 7);
            else if (dl.includes("day")) deadlineDays = Math.round(num);
            else deadlineDays = 90;
          } else {
            deadlineDays = 90;
          }
          await supabase
            .from("aspirations")
            .update({ deadline_days: deadlineDays })
            .eq("id", aspiration.id);
        }

        const totalGoals = deadlineDays * 5;

        // SUM all completion_percentage / 100
        const { data: allLogs } = await supabase
          .from("daily_goal_logs")
          .select("completion_percentage")
          .eq("user_id", body.userId);

        const sumPct = (allLogs || []).reduce(
          (acc: number, log: any) => acc + (parseFloat(log.completion_percentage) || 0), 0
        );
        const completedGoals = parseFloat((sumPct / 100).toFixed(2));
        const completionPercentage = totalGoals > 0
          ? parseFloat(((completedGoals / totalGoals) * 100).toFixed(2))
          : 0;

        const { data: existingProgress } = await supabase
          .from("aspiration_progress")
          .select("id")
          .eq("user_id", body.userId)
          .limit(1)
          .maybeSingle();

        if (existingProgress) {
          await supabase
            .from("aspiration_progress")
            .update({ total_goals: totalGoals, completed_goals: completedGoals, completion_percentage: completionPercentage, updated_at: new Date().toISOString() })
            .eq("id", existingProgress.id);
        } else {
          await supabase.from("aspiration_progress").insert({
            user_id: body.userId,
            aspiration: aspiration.description || "",
            total_goals: totalGoals,
            completed_goals: completedGoals,
            completion_percentage: completionPercentage,
          });
        }
      }

      // Update streak
      const today2 = new Date().toISOString().split("T")[0];
      const { data: streakData } = await supabase
        .from("user_streak")
        .select("*")
        .eq("user_id", body.userId)
        .maybeSingle();

      if (!streakData) {
        await supabase.from("user_streak").insert({
          user_id: body.userId,
          current_streak: 1,
          longest_streak: 1,
          last_log_date: today2,
        });
      } else if (streakData.last_log_date !== today2) {
        const lastDate = new Date(streakData.last_log_date);
        const todayDate = new Date(today2);
        lastDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        const newStreak = diffDays <= 1 ? streakData.current_streak + 1 : 1;
        const newLongest = Math.max(newStreak, streakData.longest_streak);
        await supabase.from("user_streak").update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_log_date: today2,
          updated_at: new Date().toISOString(),
        }).eq("user_id", body.userId);
      }
    }

    // --- STEP 3: Generate the conversational reply ---
    const chatMessages = [
      {
        role: "system",
        content: `You are the user's Better Self — their ideal future version and personal coach.
Aspirations: ${aspirations || "Not set"}
Goals: ${goals.map((g: any) => g.title).join(", ") || "None"}
Keep responses under 3 lines. Be direct, warm and motivational.`,
      },
      ...history.slice(-5),
      { role: "user", content: body.userMessage },
    ];

    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    let aiMessage = "I'm here to help!";
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      aiMessage = chatData.choices?.[0]?.message?.content || aiMessage;
    }

    // --- STEP 4: Store conversation ---
    await Promise.all([
      supabase.from("better_self_conversations").insert({ user_id: body.userId, message_text: body.userMessage, sender: "user" }),
      supabase.from("better_self_conversations").insert({ user_id: body.userId, message_text: aiMessage, sender: "assistant" }),
    ]);

    return new Response(JSON.stringify({ message: aiMessage, matchedGoals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
