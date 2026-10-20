import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface AspirationGapWidgetProps {
  userId: string;
  refreshTrigger?: number;
}

interface ExtractedAspiration {
  text: string;
  completion: number;
}

interface GapData {
  completionPercentage: number;
  daysRemaining: number;
  requiredPace: number;
  actualPace: number;
  status: "ahead" | "on-track" | "behind";
  totalGoalsNeeded: number;
  goalsCompleted: number;
  streakDays?: number;
}

interface DailyGoalsStats {
  total: number;
  completed: number;
}

const ASPIRATION_COLORS = ["#FF6B6B", "#1F9FFF", "#FFB84D", "#A78BFA"];
const STATUS_COLORS = {
  ahead: { bg: "#58CC02", light: "#58CC0220", icon: "trophy" },
  "on-track": { bg: "#FFB84D", light: "#FFB84D20", icon: "target" },
  behind: { bg: "#FF6B6B", light: "#FF6B6B20", icon: "alert-circle" },
};

export default function AspirationGapWidget({
  userId,
  refreshTrigger,
}: AspirationGapWidgetProps) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [aspirations, setAspirations] = useState<ExtractedAspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyGoalsStats, setDailyGoalsStats] = useState<DailyGoalsStats>({
    total: 0,
    completed: 0,
  });
  const [gapData, setGapData] = useState<GapData>({
    completionPercentage: 0,
    daysRemaining: 0,
    requiredPace: 0,
    actualPace: 0,
    status: "behind",
    totalGoalsNeeded: 0,
    goalsCompleted: 0,
  });

  const [streakDays, setStreakDays] = useState(0);

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const cardBg = isDarkMode ? "#1A2332" : "#FFFFFF";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";
  const primaryGreen = "#58CC02";

  useEffect(() => {
    loadData();
  }, [userId, refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [userId]),
  );

  // Recalculate days left every 24 hours
  useEffect(() => {
    const interval = setInterval(
      () => {
        loadGapData();
      },
      24 * 60 * 60 * 1000,
    ); // 24 hours in milliseconds

    return () => clearInterval(interval);
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAspirations(),
        loadGapData(),
        loadDailyGoalsStats(),
        loadStreak(),
      ]);
    } catch (error) {
      console.error("Error loading widget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const { data } = await (supabase.from("user_streak") as any)
        .select("current_streak")
        .eq("user_id", userId)
        .maybeSingle();
      setStreakDays(data?.current_streak || 0);
    } catch {
      setStreakDays(0);
    }
  };

  const loadAspirations = async () => {
    try {
      const { data, error } = await (supabase.from("aspirations") as any)
        .select("id, description, last_reset_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.description) {
        setAspirations([]);
        return;
      }

      // Check if 24 hours have passed since last reset
      const lastReset = new Date(data.last_reset_at);
      const now = new Date();
      const hoursSinceReset =
        (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        console.log("🔄 24 hours passed, updating last_reset_at...");
        // Just update the reset timestamp — don't wipe completed_goals
        // completed_goals is cumulative and recalculated from daily_goal_logs
        await (supabase.from("aspirations") as any)
          .update({ last_reset_at: new Date().toISOString() })
          .eq("id", data.id);
      }

      const extractedAspirations = parseAspirations(data.description);
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
    } catch (error) {
      console.error("Error loading aspirations:", error);
      setAspirations([]);
    }
  };

  const loadDailyGoalsStats = async () => {
    try {
      const { data: goals, error } = await (
        supabase.from("generated_goals") as any
      )
        .select("id, title, created_at")
        .eq("user_id", userId)
        .eq("status", "active");

      if (error || !goals || goals.length === 0) {
        setDailyGoalsStats({ total: 0, completed: 0 });
        return;
      }

      const goalIds = goals.map((g: any) => g.id);
      const todayDate = new Date().toISOString().split("T")[0];

      const { data: logs, error: logsError } = await (
        supabase.from("daily_goal_logs") as any
      )
        .select("goal_id, status, completion_percentage, log_date")
        .in("goal_id", goalIds)
        .eq("log_date", todayDate);

      const completed =
        logs?.filter(
          (log: any) =>
            log.status === "completed" || log.completion_percentage === 100,
        ).length || 0;

      setDailyGoalsStats({
        total: goals.length,
        completed,
      });
    } catch (error) {
      console.error("Error loading daily goals stats:", error);
      setDailyGoalsStats({ total: 0, completed: 0 });
    }
  };

  const loadGapData = async () => {
    try {
      console.log("📊 Loading gap data for user:", userId);

      const { data: aspiration, error: aspError } = await (
        supabase.from("aspirations") as any
      )
        .select("days_remaining, created_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (aspError || !aspiration) {
        console.log("⚠️ No aspiration found:", aspError);
        return;
      }

      const daysRemaining = aspiration.days_remaining || 0;
      console.log("📅 Days remaining:", daysRemaining);

      // Fetch progress data
      const { data: progressData, error: progressError } = await (
        supabase.from("aspiration_progress") as any
      )
        .select("total_goals, completed_goals")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progressError || !progressData) {
        console.log("⚠️ No progress data found:", progressError);
        return;
      }

      const totalGoals = progressData.total_goals || 0;
      const completedGoals = progressData.completed_goals || 0;

      // Calculate with decimal precision
      const completionPercentage = totalGoals > 0
        ? parseFloat(((completedGoals / totalGoals) * 100).toFixed(2))
        : 0;

      console.log("🎯 Total goals:", totalGoals);
      console.log("🎯 Completed goals:", completedGoals);

      // Calculate actual pace (goals completed per day since aspiration was created)
      const createdAt = new Date(aspiration.created_at);
      const now = new Date();
      const daysElapsed = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysSinceStart = Math.max(1, daysElapsed + 1); // +1 to include today
      const actualPace = completedGoals / daysSinceStart;

      console.log("📈 Days elapsed:", daysElapsed);
      console.log("📈 Days since start:", daysSinceStart);
      console.log("📈 Actual pace:", actualPace.toFixed(2), "goals/day");

      // Calculate required pace
      const goalsRemaining = totalGoals - completedGoals;
      const bufferDays = Math.ceil(daysRemaining * 0.1);
      const effectiveDays = Math.max(1, daysRemaining - bufferDays);
      const requiredPace =
        goalsRemaining > 0 ? goalsRemaining / effectiveDays : 0;

      console.log("🎯 Goals remaining:", goalsRemaining);
      console.log("🎯 Buffer days (10%):", bufferDays);
      console.log("🎯 Effective days:", effectiveDays);
      console.log("🎯 Required pace:", requiredPace.toFixed(2), "goals/day");

      setGapData((prev) => ({
        ...prev,
        completionPercentage,
        daysRemaining,
        requiredPace: Math.round(requiredPace * 10) / 10,
        actualPace: Math.round(actualPace * 10) / 10,
        totalGoalsNeeded: totalGoals,
        goalsCompleted: completedGoals,
      }));
    } catch (error) {
      console.error("Error loading gap data:", error);
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
    const delimiters = /[,\n]|(\s+and\s+)/gi;
    const parts = description.split(delimiters).filter(Boolean);

    const extracted = parts
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && part.toLowerCase() !== "and")
      .map((text) => ({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        completion: 0,
      }));

    return extracted;
  };

  const renderPieChart = (
    completion: number,
    size: number = 60,
    colorIndex: number = 0,
  ) => {
    const radius = size / 2 - 3;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completion / 100) * circumference;
    const color = ASPIRATION_COLORS[colorIndex % ASPIRATION_COLORS.length];

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill={isDarkMode ? "#2A3142" : "#E0E0E0"}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
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

  const displayedAspirations = aspirations.slice(0, 3);
  const avgProgress = Math.round(
    aspirations.reduce((sum, a) => sum + a.completion, 0) / aspirations.length,
  );

  const statusColor =
    gapData.status === "ahead"
      ? "#58CC02"
      : gapData.status === "on-track"
        ? "#FFB84D"
        : "#FF6B6B";
  const statusIcon =
    gapData.status === "ahead"
      ? "check-circle"
      : gapData.status === "on-track"
        ? "clock-alert"
        : "alert-circle";
  const statusMessage =
    gapData.status === "ahead"
      ? "Ahead of schedule!"
      : gapData.status === "on-track"
        ? "On track"
        : "Behind schedule";

  const handleCardPress = () => {
    router.push("/screens/goals");
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        Platform.OS === "ios" && {
          shadowColor: STATUS_COLORS[gapData.status].bg,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 12,
        },
      ]}
      onPress={handleCardPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={
          gapData.status === "ahead"
            ? isDarkMode
              ? ["#1A3A2A", "#0F2A1F", "#1A3A2A"]
              : ["#E8F5E9", "#C8E6C9", "#E8F5E9"]
            : gapData.status === "on-track"
              ? isDarkMode
                ? ["#3A2A1A", "#2A1A0F", "#3A2A1A"]
                : ["#FFF8E1", "#FFE0B2", "#FFF8E1"]
              : isDarkMode
                ? ["#3A1A1A", "#2A0F0F", "#3A1A1A"]
                : ["#FFEBEE", "#FFCDD2", "#FFEBEE"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContainer,
          {
            borderColor: STATUS_COLORS[gapData.status].bg,
            borderWidth: 2,
          },
        ]}
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: STATUS_COLORS[gapData.status].light,
              borderColor: STATUS_COLORS[gapData.status].bg,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={STATUS_COLORS[gapData.status].icon}
            size={16}
            color={STATUS_COLORS[gapData.status].bg}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: STATUS_COLORS[gapData.status].bg },
            ]}
          >
            {gapData.status === "ahead"
              ? "AHEAD!"
              : gapData.status === "on-track"
                ? "ON TRACK"
                : "BEHIND"}
          </Text>
        </View>

        {/* Progress to Better Self Section */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressTitle, { color: textPrimary }]}>
            🎯 Progress to becoming your better self
          </Text>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: isDarkMode ? "#2A3142" : "#E0E0E0" },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(gapData.completionPercentage, 100)}%`,
                  backgroundColor: STATUS_COLORS[gapData.status].bg,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressPercentage,
              { color: STATUS_COLORS[gapData.status].bg },
            ]}
          >
            {gapData.completionPercentage < 1
              ? `${gapData.completionPercentage.toFixed(2)}% Complete`
              : `${gapData.completionPercentage.toFixed(1)}% Complete`}
          </Text>
        </View>

        {/* Aspirations Row */}
        <View style={styles.aspirationsRow}>
          {displayedAspirations.map((aspiration, index) => (
            <View key={index} style={styles.aspirationItem}>
              <View style={styles.pieChartWrapper}>
                {renderPieChart(aspiration.completion, 60, index)}
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
                numberOfLines={1}
              >
                {aspiration.text.substring(0, 12)}
                {aspiration.text.length > 12 ? "..." : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Gap Section - Gamified */}
        <View
          style={[
            styles.gapSection,
            {
              backgroundColor: isDarkMode
                ? "rgba(0,0,0,0.3)"
                : "rgba(255,255,255,0.5)",
            },
          ]}
        >
          <View style={styles.gapMetrics}>
            <View style={styles.gapMetricItem}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={16}
                color={STATUS_COLORS[gapData.status].bg}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.gapMetricLabel, { color: textSecondary }]}>
                Days Left
              </Text>
              <Text
                style={[
                  styles.gapMetricValue,
                  { color: STATUS_COLORS[gapData.status].bg },
                ]}
              >
                {gapData.daysRemaining}
              </Text>
            </View>

            <View style={styles.gapMetricDivider} />

            <View style={styles.gapMetricItem}>
              <MaterialCommunityIcons
                name="fire"
                size={16}
                color={STATUS_COLORS[gapData.status].bg}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.gapMetricLabel, { color: textSecondary }]}>
                Day Streak
              </Text>
              <Text
                style={[
                  styles.gapMetricValue,
                  { color: STATUS_COLORS[gapData.status].bg },
                ]}
              >
                {streakDays}
              </Text>
            </View>

            <View style={styles.gapMetricDivider} />

            <View style={styles.gapMetricItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={STATUS_COLORS[gapData.status].bg}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.gapMetricLabel, { color: textSecondary }]}>
                Goals Today
              </Text>
              <Text
                style={[
                  styles.gapMetricValue,
                  { color: STATUS_COLORS[gapData.status].bg },
                ]}
              >
                {dailyGoalsStats.completed}/{dailyGoalsStats.total}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
    borderWidth: 2,
    padding: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "600",
  },
  aspirationsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  aspirationItem: {
    flex: 1,
    alignItems: "center",
  },
  pieChartWrapper: {
    position: "relative",
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  completionOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  completionPercentage: {
    fontSize: 12,
    fontWeight: "700",
  },
  aspirationLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  gapSection: {
    borderRadius: 12,
    padding: 12,
  },
  gapMetrics: {
    flexDirection: "row",
    gap: 0,
  },
  gapMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  gapMetricLabel: {
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 4,
  },
  gapMetricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  gapMetricDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#2A3142",
  },
});
