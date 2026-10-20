// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface RequestBody {
  userId: string
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const body: RequestBody = await req.json()

    if (!body.userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    console.log("📊 Generating aspiration metrics for user:", body.userId)

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error("❌ Missing environment variables")
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Get user's aspirations
    const { data: aspirations, error: aspirationsError } = await supabase
      .from("aspirations")
      .select("id, description")
      .eq("user_id", body.userId)
      .eq("status", "active")
      .limit(5)

    if (aspirationsError || !aspirations || aspirations.length === 0) {
      console.log("⚠️ No aspirations found")
      return new Response(
        JSON.stringify({ success: false, message: "No aspirations found", metrics: [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Get user's latest session and answers
    const { data: latestSession } = await supabase
      .from("goal_setup_sessions")
      .select("id")
      .eq("user_id", body.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let questionsAndAnswers: Array<{ question: string; answer: string }> = []

    if (latestSession) {
      const { data: answers } = await supabase
        .from("goal_setup_answers")
        .select("question_text, answer")
        .eq("session_id", latestSession.id)

      if (answers && answers.length > 0) {
        questionsAndAnswers = answers.map((a: any) => ({
          question: a.question_text,
          answer: a.answer,
        }))
      }
    }

    console.log("📝 Found", questionsAndAnswers.length, "Q&A pairs")

    // Generate metrics for each aspiration using AI
    const metricsPromises = aspirations.map(async (aspiration) => {
      const prompt = `You are analyzing a user's aspiration and their profile answers to generate a metric display.

ASPIRATION: "${aspiration.description}"

USER'S PROFILE ANSWERS:
${questionsAndAnswers.map((qa, i) => `${i + 1}. Q: ${qa.question}\n   A: ${qa.answer}`).join("\n\n")}

Your task:
1. Generate a SHORT metric label (1-3 words) that represents this aspiration
2. Extract the CURRENT VALUE from the user's answers (if mentioned)
3. Determine the TARGET VALUE based on the aspiration

Examples:
- Aspiration: "Become a billionaire" → Label: "Net Worth", Current: "$50,000", Target: "$1,000,000,000"
- Aspiration: "Lose 100 pounds" → Label: "Weight", Current: "250 lbs", Target: "150 lbs"
- Aspiration: "Bench press 300 lbs" → Label: "Bench Press", Current: "135 lbs", Target: "300 lbs"
- Aspiration: "Run a marathon" → Label: "Running", Current: "5K", Target: "Marathon"
- Aspiration: "Learn Spanish fluently" → Label: "Spanish Level", Current: "Beginner", Target: "Fluent"

Return ONLY a JSON object with this structure:
{
  "label": "short metric name",
  "currentValue": "current value with unit (or 'Not Set' if not found)",
  "targetValue": "target value with unit"
}

Be concise and specific. If you can't find a current value in the answers, use "Not Set".`

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 200,
        })

        const content = completion.choices[0]?.message?.content?.trim() || "{}"
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = content
        if (content.includes("```json")) {
          jsonStr = content.split("```json")[1].split("```")[0].trim()
        } else if (content.includes("```")) {
          jsonStr = content.split("```")[1].split("```")[0].trim()
        }

        const metric = JSON.parse(jsonStr)

        return {
          aspirationId: aspiration.id,
          aspirationDescription: aspiration.description,
          label: metric.label || "Progress",
          currentValue: metric.currentValue || "Not Set",
          targetValue: metric.targetValue || "Goal",
        }
      } catch (error) {
        console.error("Error generating metric for aspiration:", aspiration.description, error)
        return {
          aspirationId: aspiration.id,
          aspirationDescription: aspiration.description,
          label: "Progress",
          currentValue: "Not Set",
          targetValue: "Goal",
        }
      }
    })

    const metrics = await Promise.all(metricsPromises)

    console.log("✅ Generated metrics:", metrics)

    return new Response(
      JSON.stringify({
        success: true,
        metrics: metrics,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in generate-aspiration-metrics:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
