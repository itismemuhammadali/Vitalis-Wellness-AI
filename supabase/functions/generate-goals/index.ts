// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno URL imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// @ts-ignore - Deno global
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
// @ts-ignore - Deno global
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore - Deno global
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface RequestBody {
  userId: string;
  aspirations: string[];
  questionsAndAnswers: Array<{ question: string; answer: string }>;
  stage?: 1 | 2 | 3 | 4 | 5;
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
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
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

    const body: RequestBody = await req.json();

    // Validate input
    if (!body.userId || !body.aspirations || !body.questionsAndAnswers) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: userId, aspirations, questionsAndAnswers",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch user from database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", body.userId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const stage = body.stage || 5;

    // Fetch aspirations from database
    const { data: aspirationsData, error: aspirationsError } = await supabase
      .from("aspirations")
      .select("description")
      .eq("user_id", body.userId)
      .single();

    if (aspirationsError) {
      console.error("Error fetching aspirations:", aspirationsError);
    }

    // Fetch previous goals with their completion status and logs
    let previousGoalsContext = "";
    const { data: previousGoals, error: previousGoalsError } = await supabase
      .from("generated_goals")
      .select(
        "id, title, description, category, difficulty, estimated_time, aspiration, status, generated_date"
      )
      .eq("user_id", body.userId)
      .order("generated_date", { ascending: false })
      .limit(20);

    if (previousGoals && previousGoals.length > 0) {
      // Separate completed and incomplete goals
      const completedGoals = previousGoals.filter(
        (g: any) => g.status === "completed",
      );
      const incompleteGoals = previousGoals.filter(
        (g: any) => g.status === "active",
      );
      const archivedGoals = previousGoals.filter(
        (g: any) => g.status === "archived",
      );

      if (completedGoals.length > 0) {
        previousGoalsContext +=
          "COMPLETED GOALS (user successfully finished these):\n";
        completedGoals.forEach((goal: any, index: number) => {
          previousGoalsContext += `\n${index + 1}. ${goal.title}\n`;
          previousGoalsContext += `   Description: ${goal.description}\n`;
          previousGoalsContext += `   Category: ${goal.category}\n`;
          previousGoalsContext += `   Difficulty: ${goal.difficulty}\n`;
          previousGoalsContext += `   Date: ${goal.generated_date}\n`;
        });
        previousGoalsContext += "\n";
      }

      if (incompleteGoals.length > 0) {
        previousGoalsContext +=
          "INCOMPLETE GOALS (user is still working on these):\n";
        incompleteGoals.forEach((goal: any, index: number) => {
          previousGoalsContext += `\n${index + 1}. ${goal.title}\n`;
          previousGoalsContext += `   Description: ${goal.description}\n`;
          previousGoalsContext += `   Category: ${goal.category}\n`;
          previousGoalsContext += `   Difficulty: ${goal.difficulty}\n`;
          previousGoalsContext += `   Date: ${goal.generated_date}\n`;
        });
        previousGoalsContext += "\n";
      }

      if (archivedGoals.length > 0) {
        previousGoalsContext +=
          "ARCHIVED GOALS (from previous days, not completed):\n";
        archivedGoals.slice(0, 5).forEach((goal: any, index: number) => {
          previousGoalsContext += `\n${index + 1}. ${goal.title}\n`;
          previousGoalsContext += `   Description: ${goal.description}\n`;
          previousGoalsContext += `   Category: ${goal.category}\n`;
          previousGoalsContext += `   Difficulty: ${goal.difficulty}\n`;
          previousGoalsContext += `   Date: ${goal.generated_date}\n`;
        });
        previousGoalsContext += "\n";
      }
    }

    // Fetch questions and answers from database
    // Try goal_setup_answers first, fall back to baseline_answers
    let questionsData = null;
    let questionsError = null;

    // For goal_setup_answers, we need to find the latest session for this user
    const { data: latestSession, error: sessionError } = await supabase
      .from("goal_setup_sessions")
      .select("id")
      .eq("user_id", body.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestSession) {
      const { data: setupAnswers, error: setupError } = await supabase
        .from("goal_setup_answers")
        .select("question_text, answer")
        .eq("session_id", latestSession.id)
        .order("created_at", { ascending: true });

      if (!setupError && setupAnswers && setupAnswers.length > 0) {
        questionsData = setupAnswers;
        questionsError = setupError;
      }
    }

    // Fall back to baseline_answers if no goal_setup_answers found
    if (!questionsData || questionsData.length === 0) {
      const { data: baselineAnswers, error: baselineError } = await supabase
        .from("baseline_answers")
        .select("question, answer")
        .eq("user_id", body.userId)
        .order("created_at", { ascending: true });

      questionsData =
        baselineAnswers?.map((qa: any) => ({
          question_text: qa.question,
          answer: qa.answer,
        })) || [];
      questionsError = baselineError;
    }

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
    }

    // Build rich context with all information
    let context = "";

    // Calculate age from date_of_birth
    let age = "Not provided";
    if (userData.date_of_birth) {
      const birthDate = new Date(userData.date_of_birth);
      const today = new Date();
      age = Math.floor(
        (today.getTime() - birthDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      ).toString();
    }

    // 1. USER NAME
    context += `My name is ${userData.full_name || "Not provided"}.\n\n`;

    // 2. USER AGE
    context += `My age is ${age}.\n\n`;

    // 3. APPLICATION NAME
    context += `I am a user of an application called Kyvo.\n\n`;

    // 4. CONCEPT AND HOW IT WORKS
    context += `ABOUT KYVO APPLICATION:\n`;
    context += `Kyvo is a personal development application that helps users achieve their aspirations by breaking them down into daily actionable goals. Here's how it works:\n`;
    context += `- Users define their aspirations (big life goals they want to achieve)\n`;
    context += `- Kyvo asks targeted questions to understand where the user is in life currently\n`;
    context += `- Based on the answers, Kyvo creates 5 specific daily goals that are small, achievable steps toward their aspirations\n`;
    context += `- Incomplete goals stay in the list until they are completed\n`;
    context += `- Completed goals are replaced with new ones\n`;
    context += `- This creates a progressive journey: Goal 1 → Goal 2 → Goal 3 → ... → Aspiration Achieved\n`;
    context += `- Every 24 hours, new goals are generated based on the user's performance from the previous day\n\n`;

    // 5. USER ASPIRATIONS
    context += `MY ASPIRATIONS:\n`;
    if (aspirationsData && aspirationsData.description) {
      context += `${aspirationsData.description}\n\n`;
    } else if (body.aspirations && body.aspirations.length > 0) {
      body.aspirations.forEach((aspiration: string, index: number) => {
        context += `${index + 1}. ${aspiration}\n`;
      });
      context += `\n`;
    } else {
      context += `Not provided\n\n`;
    }

    // 6. PREVIOUS GOALS (if any)
    context += previousGoalsContext;

    // 7. QUESTIONS AND ANSWERS
    context += `QUESTIONS ASKED BY KYVO AND MY ANSWERS:\n`;
    if (questionsData && questionsData.length > 0) {
      questionsData.forEach((qa: any, index: number) => {
        const question = qa.question_text || qa.question;
        const answer = qa.answer;
        context += `Q${index + 1}: ${question}\n`;
        context += `A${index + 1}: ${answer}\n\n`;
      });
    } else {
      body.questionsAndAnswers.forEach(
        (qa: { question: string; answer: string }, index: number) => {
          context += `Q${index + 1}: ${qa.question}\n`;
          context += `A${index + 1}: ${qa.answer}\n\n`;
        },
      );
    }

    // STAGE 4: Validation - Ask AI if they understand
    if (stage === 4) {
      const validationPrompt = `${context}

ABOUT KYVO APPLICATION:
Kyvo is a personal development application that helps users achieve their aspirations by breaking them down into daily actionable goals. The concept is:
- Users define their aspirations (big life goals)
- Kyvo asks questions to understand where they are in life
- Kyvo creates daily goals that are small, achievable steps toward their aspirations
- Incomplete goals stay until completed
- Completed goals are replaced with new ones
- This creates a progressive journey: Goal 1 → Goal 2 → Goal 3 → ... → Aspiration Achieved

IMPORTANT: You created the questions that were asked to this user. Now confirm you understand them deeply.

TASK: Based on all the information above, confirm your understanding of this user and their journey.

Please answer these questions:
1. Do you understand what this user is looking for? (yes/no)
2. What are their main skills and expertise?
3. What is their current life situation?
4. What are their biggest challenges?
5. What type of daily goals would be most suitable for them as FIRST STEPS?
6. What should we focus on when creating their daily goals?
7. How can we break down their aspirations into achievable daily tasks?

Be specific and concise. Extract exact information from their profile.`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: validationPrompt }],
            temperature: 0.3,
            max_tokens: 1500,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("OpenAI API error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to validate understanding" }),
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
      const understanding = data.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({
          stage: 4,
          success: true,
          userId: body.userId,
          userName: userData.full_name,
          understanding: understanding,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // STAGE 5: Generate Goals
    if (stage === 5) {
      const goalsPrompt = `${context}

ABOUT KYVO APPLICATION:
Kyvo is a personal development application that helps users achieve their aspirations by breaking them down into daily actionable goals.

CRITICAL MISSION:
You are creating goals that will TRANSFORM this user's life TODAY. These goals must be:
1. SO COMPELLING that users feel the immediate value and want to subscribe
2. DIRECTLY ALIGNED with their aspiration - not generic tasks
3. ACHIEVABLE TODAY - something they can complete and feel proud
4. VISIBLE RESULTS - they see real progress toward their dream
5. EMOTIONALLY ENGAGING - goals that excite them, not bore them

IMPORTANT CONTEXT:
You created the questions that were asked to this user based on their aspirations. Now you are creating the daily goals based on the answers they gave to YOUR questions. This means you understand the user's situation deeply because you designed the questions specifically for their aspirations.

PREVIOUS GOALS ANALYSIS:
- Review the COMPLETED GOALS section: These are tasks the user successfully finished. DO NOT repeat these.
- Review the INCOMPLETE GOALS section: These are tasks still in progress. Consider if they should continue or if new complementary goals would help.
- Review the ARCHIVED GOALS section: These were not completed. Understand why and create better alternatives.

TASK: Create 5 SPECIFIC, ACTIONABLE daily goals for TODAY that will help this user take the NEXT STEPS toward their aspirations.

CRITICAL RULES FOR GOAL CREATION:
1. TRANSFORMATION FOCUSED: Each goal should move them closer to their aspiration in a VISIBLE way
2. SPECIFIC & MEASURABLE: Include exact numbers, types, and actions - not vague
3. ACTIONABLE TODAY: Can be completed TODAY - not someday
4. PERSONALIZED: Based on user's actual skills, age, situation, and answers
5. PROGRESSIVE: Build on completed goals - create the NEXT STEPS, not repeats
6. ASPIRATION-ALIGNED: Each goal must DIRECTLY support one of their aspirations
7. NO VAGUE WORDS: Never use "research", "learn", "explore", "read", "practice", "study", "track", "monitor"
8. REALISTIC: Consider their time availability and current situation
9. NO REPEATS: Do NOT create goals identical to completed or incomplete goals
10. BUILDING ON SUCCESS: If they completed similar goals before, make new ones slightly harder or different

EXAMPLES OF POWERFUL GOALS (specific, actionable, transformative):
- "Complete 50 push-ups in sets (10x5) and record video to track progress"
- "Run 5km without stopping and record your time"
- "Do 100 squats and feel the burn in your legs"
- "Apply to 10 freelance projects on Upwork and get your first client"
- "Build and deploy 1 full-stack feature to production"
- "Make 15 cold calls to potential clients and book 2 meetings"
- "Write and publish 1 LinkedIn post that gets 50+ views"
- "Complete a 30-minute HIIT workout and feel the energy boost"
- "Solve 5 LeetCode hard problems and submit solutions"
- "Create a portfolio project and add it to GitHub"
- "Do a 1-hour workout session and feel stronger"
- "Earn your first $100 on a freelance platform"
- "Complete a 10km run and beat your personal best"
- "Build 1 mobile app feature and test it"
- "Attend 1 networking event and make 5 new connections"

EXAMPLES OF WEAK GOALS (vague, not transformative):
- ❌ "Track food intake"
- ❌ "Eat healthy meals"
- ❌ "Research high-income skills"
- ❌ "Learn new programming concepts"
- ❌ "Read about new technologies"
- ❌ "Explore freelancing platforms"
- ❌ "Practice coding"
- ❌ "Monitor your progress"
- ❌ "Study new skills"
- ❌ "Do some exercise"

CRITICAL RESTRICTIONS:
- NEVER suggest tracking, monitoring, or recording without action
- NEVER suggest generic nutrition or meal goals
- NEVER suggest vague learning or research goals
- NEVER suggest goals that don't show immediate results
- NEVER suggest goals that don't directly support their aspiration

Return ONLY a valid JSON array with 5 goals:
[
  {
    "id": "goal1",
    "title": "Specific, powerful goal with exact numbers and action",
    "description": "Exact steps to complete this goal today and why it matters",
    "category": "Category matching their aspiration",
    "difficulty": "easy",
    "estimatedTime": 30,
    "aspiration": "Which aspiration this supports",
    "coaching": "Powerful, motivating message about why this goal matters for their dream"
  }
]`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: goalsPrompt }],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("OpenAI API error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to generate goals" }),
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
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return new Response(JSON.stringify({ error: "No content from AI" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "Invalid response format" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      let goals;
      try {
        goals = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return new Response(
          JSON.stringify({ error: "Failed to parse goals" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          stage: 5,
          success: true,
          userId: body.userId,
          userName: userData.full_name,
          goals: goals,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Default: Return context for inspection
    return new Response(
      JSON.stringify({
        stage: "context",
        success: true,
        context: context,
        message:
          "Context built successfully. Use stage 4 to validate or stage 5 to generate goals.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error in generate-goals:", error);
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
