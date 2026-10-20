// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore - Deno global
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface RequestBody {
  aspirations: string[];
  userName?: string;
  userAge?: number | null;
  previousAnswers?: Record<string, string>;
  questionCount?: number;
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
    if (!body.aspirations || !Array.isArray(body.aspirations)) {
      return new Response(
        JSON.stringify({ error: "Invalid aspirations format" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (body.aspirations.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one aspiration required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate aspiration strings
    if (
      body.aspirations.some(
        (a: string) => typeof a !== "string" || a.length > 3000,
      )
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid aspiration format" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const questionCount = body.questionCount || 15;
    if (questionCount < 1 || questionCount > 20) {
      return new Response(
        JSON.stringify({ error: "Question count must be between 1 and 20" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const previousAnswersText = body.previousAnswers
      ? Object.entries(body.previousAnswers)
          .map(([q, a]) => `Q: ${q}\nA: ${a}`)
          .join("\n\n")
      : "";

    // Step 1: Parse aspirations into individual items
    const parseAspirations = (aspirations: string[]): string[] => {
      return aspirations
        .flatMap((asp) =>
          asp
            .split(/and|,|;|\.|but|also/i)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        )
        .filter((item) => item.length > 3);
    };

    const parsedAspirations = parseAspirations(body.aspirations);

    // Step 2: Analyze each aspiration to detect its type
    const detectAspirationTypes = (
      aspirations: string[],
    ): {
      financial: boolean;
      physical: boolean;
      mental: boolean;
      social: boolean;
      spiritual: boolean;
    } => {
      const fullText = aspirations.join(" ").toLowerCase();

      const financialPatterns = /earn|money|income|salary|job|role|business|invest|wealth|financial|rich|profit|revenue|side hustle|freelance|career advancement|promotion|raise|bonus|paycheck|revenue stream|passive income|millionaire|billionaire|trillionaire|million|billion|trillion|wealthy|net worth|savings|afford|broke|debt|loan/i;
      
      const physicalPatterns = /fit|exercise|gym|muscle|weight|fat|lose|gain|strength|endurance|flexible|athletic|sport|run|walk|yoga|health|body|workout|training|cardio|stamina|lean|bulk|tone|abs|physique|appearance|look|pounds|lbs|kg|kilograms|heavier|lighter|slim|diet|nutrition|food|eating|body composition/i;
      
      const mentalPatterns = /stress|anxiety|depression|mindfulness|meditation|focus|concentration|memory|learning|confidence|self-esteem|mental health|peace|calm|clarity|overthinking|worry|panic|emotional|mood|happiness|joy|well-being/i;
      
      const socialPatterns = /relationship|friend|family|social|communication|network|dating|love|partner|spouse|connection|community|people|interact|speak|confidence|public speaking|social skills|networking|dating|romance|marriage/i;
      
      const spiritualPatterns = /spiritual|faith|religion|purpose|meaning|values|philosophy|growth|enlightenment|inner peace|soul|consciousness|mindful|zen|awakening|transcendence|divine|sacred|higher power/i;
      
      return {
        financial: financialPatterns.test(fullText),
        physical: physicalPatterns.test(fullText),
        mental: mentalPatterns.test(fullText),
        social: socialPatterns.test(fullText),
        spiritual: spiritualPatterns.test(fullText),
      };
    };

    const detectedTypes = detectAspirationTypes(parsedAspirations);

    // Step 3: Build prompt with app concept, user details, and detected types only
    let prompt = `You are a personal development coach helping users achieve their specific aspirations.

=== ABOUT THE APP ===
This app helps users track progress toward their aspirations through daily goal completion and activity logging.
- We ask discovery questions to understand their CURRENT STATE, habits, and preferences
- We do NOT ask about solutions or changes they will make - users tell us this through daily activities
- Questions must be directly relevant to their aspirations
- We focus on understanding their baseline, not coaching them

=== USER DETAILS ===
Name: ${body.userName || "User"}
Age: ${body.userAge || "Not provided"}

=== USER'S ASPIRATIONS ===
${parsedAspirations.map((asp, i) => `${i + 1}. ${asp}`).join("\n")}

${previousAnswersText ? `=== PREVIOUS ANSWERS ===\n${previousAnswersText}\n` : ""}

=== DETECTED ASPIRATION TYPES ===
${Object.entries(detectedTypes)
  .filter(([_, detected]) => detected)
  .map(([type]) => `✓ ${type.charAt(0).toUpperCase() + type.slice(1)}`)
  .join("\n")}

=== CRITICAL RULES - FOLLOW THESE EXACTLY ===
1. ONLY ask questions for DETECTED aspiration types above
2. NEVER ask about types NOT detected - if only Physical is detected, ask ZERO financial/social/mental questions
3. ONLY ask about CURRENT STATE - "What do you currently do?" NOT "What will you do?"
4. NEVER ask questions users don't know - avoid technical details
5. PHRASE QUESTIONS DIRECTLY - "What type of food do you eat?" NOT "How many fruits/vegetables?"
6. USE TEXT INPUT for preferences - let users describe in their own words
7. REMOVE DUPLICATE QUESTIONS - don't ask about the same thing twice
8. NEVER ask about solutions - we learn this through activity logging
9. NEVER ask generic questions unrelated to their aspirations

=== QUESTIONS TO ABSOLUTELY AVOID ===
✗ "What changes will you make?" - We learn this through activity logging
✗ "How much protein do you consume?" - Users don't know this
✗ "What is your specific goal?" - User already told us their aspiration
✗ "On a scale of 1-10..." - Avoid confidence/satisfaction scales
✗ "How confident are you?" - Avoid confidence questions
✗ Questions that assume problems exist
✗ Questions unrelated to detected aspirations
✗ Duplicate questions about the same topic
✗ Technical questions users can't answer

`;

    // Step 4: Add question templates ONLY for detected types
    if (detectedTypes.financial) {
      prompt += `=== FINANCIAL ASPIRATION GUIDANCE (use as inspiration, NOT literally) ===
Topics to cover for financial aspirations:
- Current income/job situation
- Available time for financial growth
- Existing skills relevant to earning more
- Current spending/saving habits
- Financial knowledge level

`;
    }

    if (detectedTypes.physical) {
      // Check if weight-related aspiration is present
      const hasWeightAspiration = parsedAspirations.some((asp) =>
        /weight|pounds|lbs|kg|kilograms|gain|lose|fat|slim|lean|bulk|heavier|lighter|400|300|250|200|150/i.test(
          asp,
        ),
      );

      prompt += `=== PHYSICAL/FITNESS ASPIRATION GUIDANCE (use as inspiration, NOT literally) ===
Topics to cover for physical aspirations:
${hasWeightAspiration ? "- Current weight (MUST BE FIRST QUESTION)\n- Weight history and changes\n- Dietary preferences and restrictions\n" : ""}
- Current exercise habits and frequency
- Current diet and eating patterns
- Sleep habits
- Current fitness level
- Available time for workouts

`;
    }

    if (detectedTypes.mental) {
      prompt += `=== MENTAL HEALTH ASPIRATION GUIDANCE (use as inspiration, NOT literally) ===
Topics to cover for mental health aspirations:
- Current stress levels and sources
- Existing coping mechanisms
- Sleep and rest habits
- Current self-care practices
- Daily routine and lifestyle

`;
    }

    if (detectedTypes.social) {
      prompt += `=== SOCIAL/RELATIONSHIP ASPIRATION GUIDANCE (use as inspiration, NOT literally) ===
Topics to cover for social aspirations:
- Current social life and activities
- Time spent with others
- Existing relationship challenges
- Communication style
- Social comfort level

`;
    }

    if (detectedTypes.spiritual) {
      prompt += `=== SPIRITUAL ASPIRATION GUIDANCE (use as inspiration, NOT literally) ===
Topics to cover for spiritual aspirations:
- Current spiritual practices
- Time dedicated to reflection/meditation
- Core values and beliefs
- Sense of purpose currently
- Existing mindfulness habits

`;
    }

    prompt += `=== OUTPUT FORMAT ===
Return ONLY a valid JSON array with this structure:
[
  {
    "id": "q1",
    "text": "Direct question about current state?",
    "type": "multiple-choice",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  },
  {
    "id": "q2",
    "text": "Open-ended question for preferences?",
    "type": "text"
  }
]

Generate exactly ${questionCount} questions total, EVENLY DISTRIBUTED across ALL detected aspiration types above.
For example if Physical AND Financial are both detected, generate ${Math.floor(questionCount / 2)} questions for each.
If 3 types detected, generate roughly ${Math.floor(questionCount / 3)} questions per type.
NEVER focus only on one aspiration type when multiple are detected.
Make sure the JSON is valid and properly formatted.
IMPORTANT: Only include questions for the detected aspiration types above. Do NOT include questions for types not detected.
${parsedAspirations.some((asp) => /weight|pounds|lbs|kg|kilograms|gain|lose|fat|slim|lean|bulk|heavier|lighter|400|300|250|200|150/i.test(asp)) ? "CRITICAL: The FIRST question MUST be 'What is your current weight?' - this is mandatory." : ""}`;


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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate questions",
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
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from response:", content);
      return new Response(
        JSON.stringify({
          error: "Invalid response format",
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

    let questions;
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", jsonMatch[0]);
      return new Response(
        JSON.stringify({ error: "Failed to parse JSON response" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    return new Response(JSON.stringify(questions), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in generate-questions:", error);
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
