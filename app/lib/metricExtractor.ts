import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
);

interface MetricData {
  label: string;
  currentValue: string;
  targetValue: string;
  category: "financial" | "career" | "health" | "mental" | "social";
}

// Priority order for aspiration types
const ASPIRATION_PRIORITY = {
  financial: 1,
  career: 2,
  health: 3,
  mental: 4,
  social: 5,
};

export async function extractMetricFromAspirations(
  userId: string,
  aspirationText: string,
  quizAnswers: Array<{ question: string; answer: string }>,
): Promise<MetricData | null> {
  try {
    // Determine aspiration category based on priority
    const category = determineAspirationCategory(aspirationText);

    if (!category) {
      return null;
    }

    // Extract target value from aspiration text
    const targetValue = extractTargetValue(aspirationText, category);

    // Extract current value from quiz answers
    const currentValue = extractCurrentValue(quizAnswers, category);

    // Generate metric label based on category
    const label = getMetricLabel(category);

    return {
      label,
      currentValue,
      targetValue,
      category,
    };
  } catch (error) {
    console.error("Error extracting metric:", error);
    return null;
  }
}

function determineAspirationCategory(
  aspirationText: string,
): "financial" | "career" | "health" | "mental" | "social" | null {
  const text = aspirationText.toLowerCase();

  // Financial keywords
  if (
    text.includes("income") ||
    text.includes("salary") ||
    text.includes("net worth") ||
    text.includes("$") ||
    text.includes("earn") ||
    text.includes("money") ||
    text.includes("financial")
  ) {
    return "financial";
  }

  // Career keywords
  if (
    text.includes("career") ||
    text.includes("job") ||
    text.includes("promotion") ||
    text.includes("role") ||
    text.includes("position") ||
    text.includes("professional")
  ) {
    return "career";
  }

  // Health/Fitness keywords
  if (
    text.includes("weight") ||
    text.includes("fit") ||
    text.includes("exercise") ||
    text.includes("muscle") ||
    text.includes("belly") ||
    text.includes("fat") ||
    text.includes("health") ||
    text.includes("flexible") ||
    text.includes("flexibility") ||
    text.includes("lbs") ||
    text.includes("kg")
  ) {
    return "health";
  }

  // Mental/Wellness keywords
  if (
    text.includes("stress") ||
    text.includes("anxiety") ||
    text.includes("peace") ||
    text.includes("calm") ||
    text.includes("mental") ||
    text.includes("meditation") ||
    text.includes("mindfulness")
  ) {
    return "mental";
  }

  // Social keywords
  if (
    text.includes("social") ||
    text.includes("network") ||
    text.includes("connection") ||
    text.includes("relationship") ||
    text.includes("community")
  ) {
    return "social";
  }

  return null;
}

function extractTargetValue(aspirationText: string, category: string): string {
  const text = aspirationText.toLowerCase();

  // Extract numbers from text
  const numberMatch = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);

  if (category === "financial") {
    if (numberMatch) {
      return `$${numberMatch[1]}`;
    }
    return "$1,000,000"; // Default
  }

  if (category === "career") {
    if (numberMatch) {
      return `$${numberMatch[1]}/year`;
    }
    return "$100,000/year"; // Default
  }

  if (category === "health") {
    if (numberMatch) {
      // Check if it's weight or percentage
      if (text.includes("lbs") || text.includes("kg")) {
        return `${numberMatch[1]} ${text.includes("kg") ? "kg" : "lbs"}`;
      }
      if (text.includes("%")) {
        return `${numberMatch[1]}%`;
      }
      return `${numberMatch[1]} lbs`;
    }
    return "170 lbs"; // Default
  }

  if (category === "mental") {
    if (numberMatch) {
      return `${numberMatch[1]}/10`;
    }
    return "3/10"; // Default stress level
  }

  if (category === "social") {
    if (numberMatch) {
      return `${numberMatch[1]} connections`;
    }
    return "500 connections"; // Default
  }

  return "N/A";
}

function extractCurrentValue(
  quizAnswers: Array<{ question: string; answer: string }>,
  category: string,
): string {
  // Search through quiz answers for relevant information
  for (const qa of quizAnswers) {
    const question = qa.question.toLowerCase();
    const answer = qa.answer.toLowerCase();

    if (category === "financial") {
      if (
        question.includes("income") ||
        question.includes("salary") ||
        question.includes("earn")
      ) {
        const numberMatch = answer.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (numberMatch) {
          return `$${numberMatch[1]}`;
        }
      }
    }

    if (category === "career") {
      if (
        question.includes("income") ||
        question.includes("salary") ||
        question.includes("earn")
      ) {
        const numberMatch = answer.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (numberMatch) {
          return `$${numberMatch[1]}/year`;
        }
      }
    }

    if (category === "health") {
      if (question.includes("weight") || question.includes("current")) {
        const numberMatch = answer.match(/(\d+(?:\.\d{1,2})?)/);
        if (numberMatch) {
          return `${numberMatch[1]} lbs`;
        }
      }
    }

    if (category === "mental") {
      if (question.includes("stress") || question.includes("anxiety")) {
        const numberMatch = answer.match(/(\d+)/);
        if (numberMatch) {
          return `${numberMatch[1]}/10`;
        }
      }
    }

    if (category === "social") {
      if (question.includes("connection") || question.includes("network")) {
        const numberMatch = answer.match(/(\d+)/);
        if (numberMatch) {
          return `${numberMatch[1]} connections`;
        }
      }
    }
  }

  // Return defaults if no match found
  if (category === "financial") return "$50,000";
  if (category === "career") return "$60,000/year";
  if (category === "health") return "185 lbs";
  if (category === "mental") return "7/10";
  if (category === "social") return "100 connections";

  return "N/A";
}

function getMetricLabel(category: string): string {
  switch (category) {
    case "financial":
      return "Net Worth";
    case "career":
      return "Annual Income";
    case "health":
      return "Weight";
    case "mental":
      return "Stress Level";
    case "social":
      return "Connections";
    default:
      return "Progress";
  }
}

export async function updateCurrentValueFromGoals(
  userId: string,
  category: string,
): Promise<string> {
  try {
    // Fetch completed goals for today
    const today = new Date().toISOString().split("T")[0];

    const { data: logs } = await supabase
      .from("daily_goal_logs")
      .select("completion_percentage")
      .eq("user_id", userId)
      .eq("log_date", today)
      .eq("status", "completed");

    if (!logs || logs.length === 0) {
      return "N/A";
    }

    // Calculate progress based on category
    const avgCompletion =
      logs.reduce((sum, log) => sum + (log.completion_percentage || 0), 0) /
      logs.length;

    // Update current value based on progress
    if (category === "health") {
      // Example: decrease weight by 0.5 lbs per completed goal
      const baseWeight = 185;
      const newWeight = Math.max(170, baseWeight - avgCompletion * 0.05);
      return `${newWeight.toFixed(1)} lbs`;
    }

    if (category === "mental") {
      // Example: decrease stress by 0.1 per completed goal
      const baseStress = 7;
      const newStress = Math.max(3, baseStress - avgCompletion * 0.01);
      return `${newStress.toFixed(1)}/10`;
    }

    if (category === "financial" || category === "career") {
      // Example: increase income by $100 per completed goal
      const baseIncome = 60000;
      const newIncome = baseIncome + avgCompletion * 100;
      return `$${Math.round(newIncome).toLocaleString()}`;
    }

    return "N/A";
  } catch (error) {
    console.error("Error updating current value:", error);
    return "N/A";
  }
}
