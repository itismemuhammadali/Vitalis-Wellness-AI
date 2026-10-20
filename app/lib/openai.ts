interface GenerateQuestionsParams {
  aspirations: string[];
  userName?: string;
  userAge?: number | null;
  previousAnswers?: Record<string, string>;
  questionCount?: number;
}

interface GeneratedQuestion {
  id: string;
  text: string;
  type: "multiple-choice" | "text" | "number";
  options?: string[];
}

interface GenerateGoalsParams {
  aspirations: string[];
  answers: Record<string, string>;
}

interface GeneratedGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export async function generateQuestions(
  params: GenerateQuestionsParams,
): Promise<GeneratedQuestion[]> {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL not configured");
    }

    console.log("📤 Calling Edge Function: generate-questions");
    console.log("🔗 URL:", `${SUPABASE_URL}/functions/v1/generate-questions`);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      },
    );

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Edge Function error response:", errorText);
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }

    const questions = await response.json();
    console.log("✅ Questions received:", questions.length);
    return questions;
  } catch (error) {
    console.error("❌ Error generating questions:", error);
    throw error;
  }
}

export async function generateGoals(
  params: GenerateGoalsParams,
): Promise<GeneratedGoal[]> {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL not configured");
    }

    console.log("📤 Calling Edge Function: generate-goals");
    console.log("🔗 URL:", `${SUPABASE_URL}/functions/v1/generate-goals`);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-goals`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      },
    );

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Edge Function error response:", errorText);
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }

    const goals = await response.json();
    console.log("✅ Goals received:", goals.length);
    return goals;
  } catch (error) {
    console.error("❌ Error generating goals:", error);
    throw error;
  }
}
