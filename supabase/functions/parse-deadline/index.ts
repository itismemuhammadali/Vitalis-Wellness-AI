// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore - Deno global
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface RequestBody {
  deadlineText: string;
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
    // Validate API key is configured
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
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
    if (!body.deadlineText || typeof body.deadlineText !== "string") {
      return new Response(JSON.stringify({ error: "Invalid deadline text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deadlineText = body.deadlineText.trim();

    if (deadlineText.length === 0 || deadlineText.length > 500) {
      return new Response(
        JSON.stringify({
          error: "Deadline text must be between 1 and 500 characters",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const prompt = `You are a deadline parser. Given a deadline description in natural language, calculate the actual target date.

Today's date is: ${todayString}

User's deadline description: "${deadlineText}"

Parse this deadline and return a JSON response with:
1. "targetDate": The calculated target date in YYYY-MM-DD format
2. "daysFromNow": Number of days from today to the target date (can be negative if in the past)
3. "interpretation": A brief explanation of how you interpreted the deadline

Rules:
- If the deadline mentions a specific month/year, calculate the date for that month/year
- If it says "within X months/weeks/days", add that duration to today
- If it says "by end of year", use December 31 of current year
- If it says "by end of month", use the last day of current month
- If it says "next summer", use June 21 of next year
- If it says "next spring", use March 21 of next year
- If it says "next winter", use December 21 of next year
- If it says "next fall/autumn", use September 21 of next year
- Be reasonable and interpret vague deadlines sensibly
- Always return a valid future date (or past if user said something in the past)

Return ONLY valid JSON, no other text.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to parse deadline",
          details: error,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenAI response structure:", data);
      return new Response(
        JSON.stringify({ error: "Invalid response from OpenAI" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const content = data.choices[0].message.content;

    if (!content) {
      console.error("No content in OpenAI response");
      return new Response(
        JSON.stringify({ error: "No content in OpenAI response" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Parse JSON from response
    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          content: content.substring(0, 200),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Validate the response has required fields
    if (!parsedResult.targetDate || parsedResult.daysFromNow === undefined) {
      console.error("Invalid parsed result:", parsedResult);
      return new Response(
        JSON.stringify({
          error: "Invalid deadline calculation result",
          result: parsedResult,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    console.log("✅ Deadline parsed successfully:", parsedResult);

    return new Response(JSON.stringify(parsedResult), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in parse-deadline:", error);
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
