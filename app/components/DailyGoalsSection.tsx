import { getGoalIcon } from "@/app/lib/goalIconLibrary";
import { GoalWithProgress } from "@/app/lib/goalsHelper";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface DailyGoalsSectionProps {
  userId: string;
  onLogProgress: (goal: GoalWithProgress) => void;
  refreshTrigger?: number;
}

const GOAL_COLORS = [
  "#FF6B6B",
  "#1F9FFF",
  "#FFB84D",
  "#A78BFA",
  "#58CC02",
  "#FF6B9D",
];

export default function DailyGoalsSection({
  userId,
  onLogProgress,
  refreshTrigger,
}: DailyGoalsSectionProps) {
  const { isDarkMode } = useTheme();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const primaryGreen = "#58CC02";

  useEffect(() => {
    loadGoals();
  }, [userId, refreshTrigger]);

  // Reload when screen comes back into focus (e.g. returning from chat)
  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [userId]),
  );

  const loadGoals = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // Get only generated goals (not custom goals)
      const { data: generatedGoals, error: generatedError } = await (
        supabase.from("generated_goals") as any
      )
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      if (generatedError) {
        console.error("Error fetching generated goals:", generatedError);
        setGoals([]);
        return;
      }

      if (!generatedGoals || generatedGoals.length === 0) {
        setGoals([]);
        return;
      }

      // Get today's logs for these goals
      const { data: logs, error: logsError } = await (
        supabase.from("daily_goal_logs") as any
      )
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", today);

      if (logsError) {
        console.error("Error fetching logs:", logsError);
      }

      // Merge goals with today's logs
      const goalsWithProgress: GoalWithProgress[] = generatedGoals.map(
        (goal: any) => {
          const todayLog = logs?.find((log: any) => log.goal_id === goal.id);
          return {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            difficulty: goal.difficulty,
            estimatedTime: goal.estimated_time,
            deadline: goal.deadline,
            aspiration: goal.aspiration,
            coaching: goal.coaching,
            todayStatus: todayLog?.status || "not_logged",
            todayCompletion: todayLog?.completion_percentage || 0,
            todayNotes: todayLog?.notes || "",
          };
        },
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error("Error loading today goals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={primaryGreen} />
      </View>
    );
  }

  if (goals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="calendar-blank"
          size={40}
          color={textSecondary}
        />
        <Text style={[styles.emptyText, { color: textSecondary }]}>
          No goals for today. Set up your goals to get started!
        </Text>
      </View>
    );
  }

  const getGoalColor = (index: number) =>
    GOAL_COLORS[index % GOAL_COLORS.length];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "check-circle";
      case "partial":
        return "progress-clock";
      case "incomplete":
        return "close-circle";
      default:
        return "circle-outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return primaryGreen;
      case "partial":
        return "#FFB84D";
      case "incomplete":
        return "#FF6B6B";
      default:
        return textSecondary;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "⭐";
      case "medium":
        return "⭐⭐";
      case "hard":
        return "⭐⭐⭐";
      default:
        return "⭐";
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIconBg,
            { backgroundColor: primaryGreen + "20" },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-today"
            size={24}
            color={primaryGreen}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Today's Goals
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            {goals.length} goal{goals.length !== 1 ? "s" : ""} to complete
          </Text>
        </View>
      </View>

      {/* Goals List */}
      <View style={styles.goalsList}>
        {goals.map((goal, index) => {
          const goalColor = getGoalColor(index);
          const isCompleted = goal.todayStatus === "completed";

          return (
            <TouchableOpacity key={goal.id} activeOpacity={0.7}>
              <LinearGradient
                colors={
                  isDarkMode
                    ? [goalColor + "15", goalColor + "08"]
                    : [goalColor + "10", goalColor + "05"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.goalCard,
                  {
                    borderColor: goalColor,
                    opacity: isCompleted ? 0.6 : 1,
                  },
                  Platform.OS === "ios" && {
                    shadowColor: goalColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  },
                  Platform.OS === "android" && {
                    elevation: 2,
                  },
                ]}
              >
                {/* Top Section: Icon + Title + Status */}
                <View style={styles.topSection}>
                  <View
                    style={[
                      styles.goalIconBg,
                      { backgroundColor: goalColor + "25" },
                    ]}
                  >
                    <Text style={styles.goalIcon}>
                      {getGoalIcon(goal.title, goal.description)}
                    </Text>
                  </View>
                  <View style={styles.goalTitleSection}>
                    <Text
                      style={[styles.goalTitle, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {goal.title}
                    </Text>
                    <Text
                      style={[styles.goalDescription, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      {goal.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(goal.todayStatus || "not_logged") +
                          "20",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getStatusIcon(goal.todayStatus || "not_logged")}
                      size={16}
                      color={getStatusColor(goal.todayStatus || "not_logged")}
                    />
                  </View>
                </View>

                {/* Middle Section: Category, Difficulty, Completion */}
                <View style={styles.middleSection}>
                  <View
                    style={[
                      styles.metaBadge,
                      { backgroundColor: isDarkMode ? "#2A3142" : "#F0F0F0" },
                    ]}
                  >
                    <Text style={[styles.metaText, { color: textSecondary }]}>
                      {goal.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metaBadge,
                      { backgroundColor: goalColor + "20" },
                    ]}
                  >
                    <Text style={[styles.metaText, { color: goalColor }]}>
                      {getDifficultyIcon(goal.difficulty)}
                    </Text>
                  </View>
                  {goal.todayStatus !== "not_logged" && (
                    <View
                      style={[
                        styles.metaBadge,
                        { backgroundColor: primaryGreen + "20" },
                      ]}
                    >
                      <Text style={[styles.metaText, { color: primaryGreen }]}>
                        {goal.todayCompletion}%
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  goalIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  goalIcon: {
    fontSize: 20,
  },
  goalTitleSection: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 11,
    fontWeight: "400",
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  middleSection: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
