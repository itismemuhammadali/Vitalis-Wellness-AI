import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface AspirationProgressCardProps {
  userId: string;
}

interface ExtractedAspiration {
  text: string;
  completion: number;
}

interface DeadlineInfo {
  deadline: Date | null;
  daysRemaining: number;
  totalDays: number;
}

interface DailyGoalsStats {
  total: number;
  completed: number;
}

const ASPIRATION_COLORS = ["#FF6B6B", "#1F9FFF", "#FFB84D", "#A78BFA"];

export default function AspirationProgressCard({
  userId,
}: AspirationProgressCardProps) {
  const { isDarkMode } = useTheme();
  const [aspirations, setAspirations] = useState<ExtractedAspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo>({
    deadline: null,
    daysRemaining: 0,
    totalDays: 0,
  });
  const [dailyGoalsStats, setDailyGoalsStats] = useState<DailyGoalsStats>({
    total: 0,
    completed: 0,
  });

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const cardBg = isDarkMode ? "#1A2332" : "#FFFFFF";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";
  const primaryGreen = "#58CC02";

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch the latest aspiration record from the database
      const { data, error } = await (supabase.from("aspirations") as any)
        .select("description")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching aspirations:", error);
        setAspirations([]);
        return;
      }

      if (!data || !data.description) {
        setAspirations([]);
        return;
      }

      // Extract deadline from description
      const deadline = extractDeadline(data.description);
      setDeadlineInfo(deadline);

      // Parse the description to extract individual aspirations
      const extractedAspirations = parseAspirations(data.description);

      // Fetch actual progress from daily goals
      const aspirationsWithProgress = await Promise.all(
        extractedAspirations.map(async (aspiration) => {
          const progress = await calculateAspirationProgress(aspiration.text);
          return {
            ...aspiration,
            completion: progress,
          };
        }),
      );

      setAspirations(aspirationsWithProgress);

      // Fetch today's daily goals stats
      const stats = await fetchTodayGoalsStats();
      setDailyGoalsStats(stats);
    } catch (error) {
      console.error("Error loading aspiration data:", error);
      setAspirations([]);
    } finally {
      setLoading(false);
    }
  };

  const extractDeadline = (description: string): DeadlineInfo => {
    const text = description.toLowerCase();
    const now = new Date();
    let deadline: Date | null = null;

    // Patterns to match
    const patterns = [
      { regex: /by the end of next month/i, months: 1, endOfMonth: true },
      { regex: /by the end of this month/i, months: 0, endOfMonth: true },
      { regex: /by next month/i, months: 1, endOfMonth: false },
      { regex: /in (\d+) days?/i, days: true },
      { regex: /in (\d+) weeks?/i, weeks: true },
      { regex: /in (\d+) months?/i, months: true },
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        if (pattern.endOfMonth) {
          deadline = new Date(
            now.getFullYear(),
            now.getMonth() + (pattern.months || 0) + 1,
            0,
          );
        } else if (pattern.days) {
          const days = parseInt(match[1]);
          deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        } else if (pattern.weeks) {
          const weeks = parseInt(match[1]);
          deadline = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
        } else if (pattern.months) {
          const months = parseInt(match[1]);
          deadline = new Date(
            now.getFullYear(),
            now.getMonth() + months,
            now.getDate(),
          );
        }
        break;
      }
    }

    if (!deadline) {
      // Default to 30 days if no deadline found
      deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const daysRemaining = Math.ceil(
      (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    const totalDays = Math.ceil(
      (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    return { deadline, daysRemaining, totalDays };
  };

  const fetchTodayGoalsStats = async (): Promise<DailyGoalsStats> => {
    try {
      // Get today's date range (start and end of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = tomorrow.toISOString();

      console.log(
        "📅 Fetching goals created between:",
        todayStart,
        "and",
        tomorrowStart,
      );

      // Get all active goals (not just today's)
      const { data: goals, error } = await (
        supabase.from("generated_goals") as any
      )
        .select("id, title, created_at")
        .eq("user_id", userId)
        .eq("status", "active");

      console.log("🎯 Total active goals:", goals?.length || 0);

      if (error) {
        console.error("❌ Error fetching goals:", error);
        return { total: 0, completed: 0 };
      }

      if (!goals || goals.length === 0) {
        console.log("⚠️ No active goals found");
        return { total: 0, completed: 0 };
      }

      // Get logs for all goals
      const goalIds = goals.map((g: any) => g.id);
      const todayDate = new Date().toISOString().split("T")[0];

      const { data: logs, error: logsError } = await (
        supabase.from("daily_goal_logs") as any
      )
        .select("goal_id, status, completion_percentage, log_date")
        .in("goal_id", goalIds)
        .eq("log_date", todayDate);

      console.log("📝 Logs found for today:", logs?.length || 0);

      if (logsError) {
        console.error("❌ Error fetching logs:", logsError);
        return { total: goals.length, completed: 0 };
      }

      // Count completed goals (status is 'completed' OR completion_percentage is 100)
      const completed =
        logs?.filter(
          (log: any) =>
            log.status === "completed" || log.completion_percentage === 100,
        ).length || 0;

      console.log(`✅ Today's goals: ${completed}/${goals.length} completed`);

      return {
        total: goals.length,
        completed,
      };
    } catch (error) {
      console.error("❌ Error fetching today goals stats:", error);
      return { total: 0, completed: 0 };
    }
  };

  const calculateAspirationProgress = async (
    aspirationText: string,
  ): Promise<number> => {
    try {
      // Get all active goals for this user
      const { data: allGoals } = await (supabase.from("generated_goals") as any)
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active");

      if (!allGoals || allGoals.length === 0) return 0;

      const goalIds = allGoals.map((g: any) => g.id);

      // Get today's logs
      const todayDate = new Date().toISOString().split("T")[0];
      const { data: logs } = await (supabase.from("daily_goal_logs") as any)
        .select("goal_id, completion_percentage")
        .in("goal_id", goalIds)
        .eq("log_date", todayDate);

      if (!logs || logs.length === 0) return 0;

      // Average completion across all goals today
      const totalPct = logs.reduce((sum: number, log: any) => sum + (parseFloat(log.completion_percentage) || 0), 0);
      return Math.round(totalPct / allGoals.length);
    } catch (error) {
      console.error("Error calculating aspiration progress:", error);
      return 0;
    }
  };

  const parseAspirations = (description: string): ExtractedAspiration[] => {
    // Split by common delimiters: commas, "and", periods, newlines
    const delimiters = /[,\n]|(\s+and\s+)/gi;
    const parts = description.split(delimiters).filter(Boolean);

    // Clean up each part and filter out empty strings
    const extracted = parts
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && part.toLowerCase() !== "and")
      .map((text) => ({
        text: text.charAt(0).toUpperCase() + text.slice(1), // Capitalize first letter
        completion: 0, // Start at 0% since no progress has been logged
      }));

    return extracted;
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: cardBg, borderColor }]}
      >
        <ActivityIndicator size="small" color={primaryGreen} />
      </View>
    );
  }

  if (aspirations.length === 0) {
    return null;
  }

  // Show max 4 aspirations, rest can be viewed by clicking
  const displayedAspirations = aspirations.slice(0, 4);
  const hasMore = aspirations.length > 4;
  const avgProgress = Math.round(
    aspirations.reduce((sum, a) => sum + a.completion, 0) / aspirations.length,
  );

  const renderPieChart = (
    completion: number,
    size: number = 70,
    colorIndex: number = 0,
  ) => {
    const radius = size / 2 - 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completion / 100) * circumference;
    const color = ASPIRATION_COLORS[colorIndex % ASPIRATION_COLORS.length];

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill={isDarkMode ? "#2A3142" : "#E0E0E0"}
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </G>
      </Svg>
    );
  };

  return (
    <View
      style={[
        styles.container,
        Platform.OS === "ios" && {
          shadowColor: "rgba(0,0,0,0.1)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        Platform.OS === "android" && {
          elevation: 6,
        },
      ]}
    >
      <LinearGradient
        colors={
          isDarkMode
            ? ["#1A2332", "#2A3A4A", "#1F2E3F"]
            : ["#FFFFFF", "#E0F7FF", "#FFD6E8"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientContainer, { borderColor }]}
      >
        {/* Header with Icon */}
        <View style={styles.header}>
          <View
            style={[
              styles.headerIconContainer,
              { backgroundColor: primaryGreen + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="target"
              size={24}
              color={primaryGreen}
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>
              Your Progress
            </Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              {dailyGoalsStats.completed}/{dailyGoalsStats.total} completed
              today
            </Text>
          </View>
        </View>

        {/* Pie Charts Grid */}
        <View style={styles.chartsGrid}>
          {displayedAspirations.map((aspiration, index) => (
            <View key={index} style={styles.chartItem}>
              <View style={styles.pieChartWrapper}>
                {renderPieChart(aspiration.completion, 70, index)}
                <View style={styles.completionOverlay}>
                  <Text
                    style={[
                      styles.completionPercentage,
                      {
                        color:
                          ASPIRATION_COLORS[index % ASPIRATION_COLORS.length],
                      },
                    ]}
                  >
                    {aspiration.completion}%
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.aspirationLabel, { color: textPrimary }]}
                numberOfLines={2}
              >
                {aspiration.text}
              </Text>
            </View>
          ))}

          {/* View All Button if more than 4 */}
          {hasMore && (
            <View style={styles.chartItem}>
              <View
                style={[
                  styles.viewAllButton,
                  { backgroundColor: primaryGreen + "20" },
                ]}
              >
                <Text style={[styles.viewAllText, { color: primaryGreen }]}>
                  +{aspirations.length - 4}
                </Text>
              </View>
              <Text style={[styles.aspirationLabel, { color: textSecondary }]}>
                View All
              </Text>
            </View>
          )}
        </View>

        {/* Gamified Stats Section */}
        <View
          style={[
            styles.statsSection,
            { backgroundColor: isDarkMode ? "#0F1419" : "#F9F9F9" },
          ]}
        >
          <View style={styles.statItem}>
            <View
              style={[styles.statIconBg, { backgroundColor: "#FF6B6B" + "20" }]}
            >
              <Text style={styles.statIcon}>🎯</Text>
            </View>
            <Text style={[styles.statValue, { color: textPrimary }]}>
              {aspirations.length}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>
              Aspirations
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: primaryGreen + "20" },
              ]}
            >
              <Text style={styles.statIcon}>📈</Text>
            </View>
            <Text style={[styles.statValue, { color: primaryGreen }]}>
              {avgProgress}%
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>
              Avg Progress
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View
              style={[styles.statIconBg, { backgroundColor: "#1F9FFF" + "20" }]}
            >
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statValue, { color: "#1F9FFF" }]}>
              {dailyGoalsStats.completed}/{dailyGoalsStats.total}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>
              Today's Goals
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  gradientContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerIconContainer: {
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
  chartsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  chartItem: {
    flex: 1,
    alignItems: "center",
  },
  pieChartWrapper: {
    position: "relative",
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  completionOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: "700",
  },
  aspirationLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
  viewAllButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  viewAllText: {
    fontSize: 20,
    fontWeight: "700",
  },
  statsSection: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: "#2A3142",
  },
});
