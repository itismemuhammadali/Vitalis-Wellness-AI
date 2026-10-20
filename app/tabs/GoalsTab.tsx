import DailyGoalsSection from "@/app/components/DailyGoalsSection";
import LogProgressModal from "@/app/components/LogProgressModal";
import { useAuth } from "@/app/context/AuthContext";
import { getGoalIcon } from "@/app/lib/goalIconLibrary";
import {
    GoalWithProgress,
    createUserGoal,
    getCustomGoals,
} from "@/app/lib/goalsHelper";
import SetGoalModal from "@/app/widgets/SetGoalModal";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/context/ThemeContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface Goal {
  id: string;
  icon: string;
  title: string;
  category: string;
  percentage: number;
  description: string;
  progress: number;
}

const SAMPLE_GOALS: Goal[] = [];

export default function GoalsTab() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [setGoalModalVisible, setSetGoalModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(
    null,
  );
  const [showLogProgressModal, setShowLogProgressModal] = useState(false);
  const [customGoals, setCustomGoals] = useState<GoalWithProgress[]>([]);
  const [loadingCustomGoals, setLoadingCustomGoals] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const cardBg = isDarkMode ? "#1A1F2E" : "#FFFFFF";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";
  const primaryGreen = "#58CC02";

  const GOAL_COLORS = [
    "#FF6B6B",
    "#1F9FFF",
    "#FFB84D",
    "#A78BFA",
    "#58CC02",
    "#FF6B9D",
  ];

  useEffect(() => {
    if (user?.id) {
      loadCustomGoals();
    }
  }, [user?.id]);

  const loadCustomGoals = async () => {
    if (!user?.id) return;
    try {
      setLoadingCustomGoals(true);
      const goals = await getCustomGoals(user.id);
      console.log(
        "✅ Custom goals loaded:",
        goals.map((g) => ({
          id: g.id,
          title: g.title,
          todayCompletion: g.todayCompletion,
          todayStatus: g.todayStatus,
        })),
      );
      setCustomGoals(goals);
    } catch (error) {
      console.error("Error loading custom goals:", error);
    } finally {
      setLoadingCustomGoals(false);
    }
  };

  // Group goals by category
  const groupedGoals = SAMPLE_GOALS.reduce(
    (acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = [];
      }
      acc[goal.category].push(goal);
      return acc;
    },
    {} as Record<string, Goal[]>,
  );

  const handleLogGoalProgress = (goal: GoalWithProgress) => {
    setSelectedGoal(goal);
    setShowLogProgressModal(true);
  };

  const handleLogProgressSuccess = () => {
    // Refresh both daily and custom goals after a small delay to ensure database is updated
    setTimeout(() => {
      loadCustomGoals();
      setRefreshTrigger((prev) => prev + 1);
    }, 500);
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* TODAY'S GOALS SECTION */}
        {user?.id && (
          <View style={styles.sectionWrapper}>
            <DailyGoalsSection
              userId={user.id}
              onLogProgress={handleLogGoalProgress}
              refreshTrigger={refreshTrigger}
            />
          </View>
        )}

        {/* MY CUSTOM GOALS SECTION */}
        {customGoals.length > 0 && (
          <View style={styles.customGoalsSection}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.headerIconBg,
                  { backgroundColor: primaryGreen + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="star-plus"
                  size={24}
                  color={primaryGreen}
                />
              </View>
              <View style={styles.headerContent}>
                <ThemedText
                  style={[styles.sectionTitle, { color: textPrimary }]}
                >
                  My Custom Goals
                </ThemedText>
                <ThemedText
                  style={[styles.sectionSubtitle, { color: textSecondary }]}
                >
                  {customGoals.length} goal{customGoals.length !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            </View>

            {customGoals.map((goal, index) => {
              const goalColor = GOAL_COLORS[index % GOAL_COLORS.length];
              const icon = getGoalIcon(goal.title, goal.description);
              const isCompleted = goal.todayStatus === "completed";

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
                      styles.customGoalCard,
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
                        <ThemedText style={styles.goalIcon}>{icon}</ThemedText>
                      </View>
                      <View style={styles.goalTitleSection}>
                        <ThemedText
                          style={[styles.goalTitle, { color: textPrimary }]}
                          numberOfLines={1}
                        >
                          {goal.title}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.goalDescription,
                            { color: textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {goal.description}
                        </ThemedText>
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
                          color={getStatusColor(
                            goal.todayStatus || "not_logged",
                          )}
                        />
                      </View>
                    </View>

                    {/* Middle Section: Category, Difficulty, Completion */}
                    <View style={styles.middleSection}>
                      <View
                        style={[
                          styles.metaBadge,
                          {
                            backgroundColor: isDarkMode ? "#2A3142" : "#F0F0F0",
                          },
                        ]}
                      >
                        <ThemedText
                          style={[styles.metaText, { color: textSecondary }]}
                        >
                          {goal.category}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.metaBadge,
                          { backgroundColor: goalColor + "20" },
                        ]}
                      >
                        <ThemedText
                          style={[styles.metaText, { color: goalColor }]}
                        >
                          {getDifficultyIcon(goal.difficulty)}
                        </ThemedText>
                      </View>
                      {goal.todayStatus !== "not_logged" && (
                        <View
                          style={[
                            styles.metaBadge,
                            { backgroundColor: primaryGreen + "20" },
                          ]}
                        >
                          <ThemedText
                            style={[styles.metaText, { color: primaryGreen }]}
                          >
                            {goal.todayCompletion}%
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Set New Goal Button */}
        <TouchableOpacity
          style={[
            styles.setGoalButton,
            {
              backgroundColor: "#58CC02",
            },
          ]}
          onPress={() => setSetGoalModalVisible(true)}
        >
          <ThemedText style={[styles.setGoalButtonText, { color: "#FFFFFF" }]}>
            + Set New Goal
          </ThemedText>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Set Goal Modal */}
      <SetGoalModal
        visible={setGoalModalVisible}
        onClose={() => setSetGoalModalVisible(false)}
        onSubmit={async (data) => {
          if (user?.id) {
            const success = await createUserGoal(
              user.id,
              data.title,
              data.description,
              data.category || "other",
              data.targetDate,
            );
            if (success) {
              setSetGoalModalVisible(false);
              // Refresh goals by triggering a re-render
              handleLogProgressSuccess();
            }
          }
        }}
      />

      {/* Log Progress Modal */}
      {user?.id && (
        <LogProgressModal
          visible={showLogProgressModal}
          goal={selectedGoal}
          userId={user.id}
          onClose={() => setShowLogProgressModal(false)}
          onSuccess={handleLogProgressSuccess}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionWrapper: {
    marginBottom: 24,
  },
  customGoalsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  customGoalCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 12,
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
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 10,
    fontWeight: "600",
  },
  customGoalTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  customGoalBottom: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  setGoalButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  setGoalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  spacer: {
    height: 20,
  },
});
