import { useAuth } from "@/app/context/AuthContext";
import { generateQuestions } from "@/app/lib/openai";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "text" | "number";
  options?: string[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  aspiration?: string;
  coaching?: string;
}

export default function DynamicQuestionScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const aspirations = (params.aspirations as string)?.split(",") || [];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingGoals, setGeneratingGoals] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const cardBg = isDarkMode ? "#1A2332" : "#FFFFFF";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";
  const progressColor = "#58CC02";

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  const checkExistingQuestionsForUser = async (): Promise<{
    sessionId: string | null;
    questions: Question[];
    hasExisting: boolean;
  }> => {
    try {
      if (!user?.id) {
        return { sessionId: null, questions: [], hasExisting: false };
      }

      // Get the latest session for THIS SPECIFIC USER
      const { data: latestSession, error: sessionError } = await (
        supabase.from("goal_setup_sessions") as any
      )
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error("Error querying sessions:", sessionError);
        return { sessionId: null, questions: [], hasExisting: false };
      }

      if (!latestSession) {
        console.log("📝 No existing session for this user");
        return { sessionId: null, questions: [], hasExisting: false };
      }

      // Get questions for THIS USER'S session
      const { data: existingQuestions, error: questionsError } = await (
        supabase.from("goal_setup_questions") as any
      )
        .select("id, question_text, question_type, options, order_index")
        .eq("session_id", latestSession.id)
        .order("order_index", { ascending: true });

      if (questionsError) {
        console.error("Error querying questions:", questionsError);
        return {
          sessionId: latestSession.id,
          questions: [],
          hasExisting: false,
        };
      }

      if (!existingQuestions || existingQuestions.length === 0) {
        console.log("📝 No questions found for this user's session");
        return {
          sessionId: latestSession.id,
          questions: [],
          hasExisting: false,
        };
      }

      // Convert to Question format
      const formattedQuestions: Question[] = existingQuestions.map(
        (q: any) => ({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          options: q.options,
        }),
      );

      console.log(
        "✅ Loaded existing questions for this user from session:",
        latestSession.id,
      );
      return {
        sessionId: latestSession.id,
        questions: formattedQuestions,
        hasExisting: true,
      };
    } catch (error) {
      console.error("Error checking existing questions:", error);
      return { sessionId: null, questions: [], hasExisting: false };
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      // Check if THIS USER already has questions
      const existing = await checkExistingQuestionsForUser();

      if (
        existing.hasExisting &&
        existing.sessionId &&
        existing.questions.length > 0
      ) {
        // Reuse existing questions for this user
        setSessionId(existing.sessionId);
        setQuestions(existing.questions);
        console.log(
          "✅ Reusing existing questions for this user from session:",
          existing.sessionId,
        );
      } else {
        // Generate NEW questions for this user
        const { data: sessionData, error: sessionError } = await (
          supabase.from("goal_setup_sessions") as any
        )
          .insert({
            user_id: user.id,
            aspirations: aspirations,
          })
          .select()
          .single();

        if (sessionError) {
          console.error("Error creating session:", sessionError);
          setLoading(false);
          return;
        }

        setSessionId(sessionData.id);
        console.log("✅ New session created for this user:", sessionData.id);

        // Fetch user data for personalized prompt
        const { data: userData } = await (supabase.from("users") as any)
          .select("full_name, age")
          .eq("id", user.id)
          .maybeSingle();

        console.log("👤 User data:", userData);

        // Generate fresh questions with user context
        const generatedQuestions = await generateQuestions({
          aspirations,
          userName: userData?.full_name || "User",
          userAge: userData?.age || null,
          questionCount: 15,
        });

        setQuestions(generatedQuestions);
        console.log(
          "✅ Generated",
          generatedQuestions.length,
          "new questions for this user",
        );

        // Save questions to database
        const questionsToSave = generatedQuestions.map((q, index) => ({
          session_id: sessionData.id,
          question_id: q.id,
          question_text: q.text,
          question_type: q.type,
          options: q.options || null,
          order_index: index,
        }));

        const { error: questionsError } = await (
          supabase.from("goal_setup_questions") as any
        ).insert(questionsToSave);

        if (questionsError) {
          console.error("Error saving questions:", questionsError);
        } else {
          console.log("✅ Questions saved to database for this user");
        }
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = async () => {
    if (!currentQuestion || !sessionId) return;

    const answer =
      currentQuestion.type === "multiple-choice" ? selectedOption : textAnswer;

    if (!answer) return;

    // Save answer to state
    const updatedAnswers = {
      ...answers,
      [currentQuestion.text]: answer,
    };
    setAnswers(updatedAnswers);

    // Save answer to database immediately
    const { error } = await (supabase.from("goal_setup_answers") as any).insert(
      {
        session_id: sessionId,
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        answer: answer,
      },
    );

    if (error) {
      console.error("Error saving answer:", error);
    } else {
      console.log("✅ Answer saved to database");
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setTextAnswer("");
    } else {
      // All questions answered, generate goals
      handleFinish(answer, updatedAnswers);
    }
  };

  const handleFinish = async (
    lastAnswer: string,
    allAnswers: Record<string, string>,
  ) => {
    try {
      setGeneratingGoals(true);
      const finalAnswers = allAnswers || {
        ...answers,
        [currentQuestion.text]: lastAnswer,
      };

      // Convert answers object to array format for the API
      const questionsAndAnswers = Object.entries(finalAnswers).map(
        ([question, answer]) => ({
          question,
          answer,
        }),
      );

      // Call the new staged generate-goals Edge Function (Stage 5)
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-goals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            aspirations,
            questionsAndAnswers,
            stage: 5, // Goal generation stage
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate goals");
      }

      const result = await response.json();

      if (!result.success || !result.goals) {
        throw new Error("Invalid response from goal generation");
      }

      // Save goals to database
      if (sessionId && user?.id) {
        const today = new Date().toISOString().split("T")[0];
        const goalsToSave = result.goals.map((g: any, index: number) => ({
          session_id: sessionId,
          user_id: user.id,
          goal_id: `goal_${index + 1}`,
          title: g.title,
          description: g.description,
          category: g.category,
          difficulty: g.difficulty,
          estimated_time: g.estimatedTime,
          aspiration: g.aspiration,
          coaching: g.coaching,
          status: "active",
          generated_date: today,
        }));

        const { error } = await (
          supabase.from("generated_goals") as any
        ).insert(goalsToSave);

        if (error) {
          console.error("Error saving goals:", error);
        } else {
          console.log("✅ Goals saved to database");

          // Update aspiration_progress with today's goal count
          const { updateAspirationProgressOnGoalGeneration } =
            await import("../lib/updateAspirationProgress");
          await updateAspirationProgressOnGoalGeneration(
            user.id,
            goalsToSave.length,
          );
        }
      }

      // Navigate to home screen (goals are already saved to database)
      router.push("/screens/home");
    } catch (error) {
      console.error("Error generating goals:", error);
      router.push("/screens/home");
    } finally {
      setGeneratingGoals(false);
    }
  };

  const handleSkip = () => {
    router.push("/screens/home");
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(null);
      setTextAnswer("");
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={progressColor} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            Preparing your questions...
          </Text>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={textSecondary} />
          <Text style={[styles.loadingText, { color: textPrimary, marginTop: 12 }]}>
            Couldn't load questions
          </Text>
          <Text style={[styles.loadingText, { color: textSecondary, fontSize: 14, marginTop: 4 }]}>
            Check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: "#58CC02", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25 }}
            onPress={loadQuestions}
          >
            <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16 }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
            <Text style={{ color: textSecondary, fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: progressColor }]}
          onPress={handleBack}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={progressColor}
          />
        </TouchableOpacity>
        <Text style={[styles.progressText, { color: progressColor }]}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[styles.progressBarContainer, { backgroundColor: borderColor }]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <Text style={[styles.question, { color: textPrimary }]}>
          {currentQuestion.text}
        </Text>

        {/* Answer Options */}
        {currentQuestion.type === "multiple-choice" &&
        currentQuestion.options ? (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: cardBg,
                    borderColor:
                      selectedOption === option ? progressColor : borderColor,
                    borderWidth: selectedOption === option ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedOption(option)}
              >
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor:
                        selectedOption === option ? progressColor : borderColor,
                      backgroundColor:
                        selectedOption === option
                          ? progressColor
                          : "transparent",
                    },
                  ]}
                >
                  {selectedOption === option && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color="#000000"
                    />
                  )}
                </View>
                <Text style={[styles.optionText, { color: textPrimary }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
                color: textPrimary,
              },
            ]}
            placeholder="Type your answer here..."
            placeholderTextColor={textSecondary}
            value={textAnswer}
            onChangeText={setTextAnswer}
            multiline
            numberOfLines={4}
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor:
                selectedOption || textAnswer ? progressColor : "#4A5568",
            },
          ]}
          onPress={handleAnswer}
          disabled={(!selectedOption && !textAnswer) || generatingGoals}
        >
          {generatingGoals ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text
              style={[
                styles.nextButtonText,
                {
                  color: selectedOption || textAnswer ? "#000000" : "#808080",
                },
              ]}
            >
              {currentQuestionIndex === questions.length - 1
                ? "Finish"
                : "Next"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} disabled={generatingGoals}>
          <Text style={[styles.skipText, { color: textSecondary }]}>
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    marginTop: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 8,
    marginHorizontal: 16,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  question: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    lineHeight: 36,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 12,
    marginBottom: 20,
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
