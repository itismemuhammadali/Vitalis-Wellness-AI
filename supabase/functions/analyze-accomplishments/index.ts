// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, accomplishmentText, goals } = await req.json();

    // Validate inputs
    if (!userId || !accomplishmentText || !goals || !Array.isArray(goals)) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore - Deno global
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt
    const goalsText = goals.map((g: any) => `- ${g.title}: ${g.description}`).join("\n");
    
    const prompt = `Analyze this accomplishment against these goals:

Accomplishment: "${accomplishmentText}"

Goals:
${goalsText}

Return ONLY a JSON array like this:
[{"goalIndex": 0, "completion": 75, "status": "partial", "reason": "reason here"}]`;

    // Call OpenAI
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error("OpenAI error:", aiResponse.status, errorData);
      return new Response(
        JSON.stringify({ error: "OpenAI request failed", status: aiResponse.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let matches: any[];
    try {
      matches = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate matches array
    if (!Array.isArray(matches) || matches.length === 0) {
      return new Response(
        JSON.stringify({ success: true, matches: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map to goal IDs
    const result = matches
      .filter((m: any) => m.goalIndex !== undefined && m.goalIndex >= 0 && m.goalIndex < goals.length)
      .map((m: any) => {
        const completion = Math.min(100, Math.max(0, m.completion || 0));
        // Auto-set status to 'completed' if completion is 100%
        const status = completion === 100 ? 'completed' : (
          ['completed', 'partial', 'incomplete'].includes(m.status) ? m.status : 'partial'
        );
        
        return {
          goalId: goals[m.goalIndex]?.id,
          title: goals[m.goalIndex]?.title,
          completion: completion,
          status: status,
          reason: m.reason || '',
        };
      });

    return new Response(
      JSON.stringify({ success: true, matches: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Function error:", errorMsg);
    return new Response(
      JSON.stringify({ error: "Internal error", details: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
