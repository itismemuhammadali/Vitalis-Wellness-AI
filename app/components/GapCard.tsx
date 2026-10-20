import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface GapCardProps {
  userId: string;
}

interface GapData {
  completionPercentage: number;
  daysRemaining: number;
  requiredPace: number;
  actualPace: number;
  status: "ahead" | "on-track" | "behind";
  totalGoalsNeeded: number;
  goalsCompleted: number;
}

export default function GapCard({ userId }: GapCardProps) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [gapData, setGapData] = useState<GapData>({
    completionPercentage: 0,
    daysRemaining: 0,
    requiredPace: 0,
    actualPace: 0,
    status: "behind",
    totalGoalsNeeded: 0,
    goalsCompleted: 0,
  });

  useEffect(() => {
    calculateGap();
  }, [userId]);

  const calculateGap = async () => {
    try {
      setLoading(true);
      console.log("📊 Calculating gap for user:", userId);

      // 1. Get aspiration with deadline
      const { data: aspiration, error: aspError } = await (
        supabase.from("aspirations") as any
      )
        .select("id, description, deadline, created_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (aspError || !aspiration) {
        console.log("⚠️ No aspiration found");
        setLoading(false);
        return;
      }

      console.log("🎯 Aspiration:", aspiration);

      // 2. Check if deadline exists
      if (!aspiration.deadline) {
        console.log("⚠️ No deadline set for aspiration");
        setLoading(false);
        return;
      }

      // 3. Parse deadline text with AI
      let daysRemaining = 0;
      try {
        console.log("🤖 Parsing deadline with AI:", aspiration.deadline);

        const parseResponse = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/parse-deadline`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              deadlineText: aspiration.deadline,
            }),
          },
        );

        if (!parseResponse.ok) {
          throw new Error("Failed to parse deadline");
        }

        const parseResult = await parseResponse.json();
        console.log("✅ Deadline parsed:", parseResult);

        daysRemaining = parseResult.daysFromNow || 0;

        // Save the calculated days to the database
        if (daysRemaining > 0) {
          console.log("💾 Saving deadline_days and days_remaining:", daysRemaining);

          // Only set days_remaining if it's not already set (first time)
          const { data: current } = await (supabase.from("aspirations") as any)
            .select("days_remaining")
            .eq("id", aspiration.id)
            .single();

          const updatePayload: any = {
            deadline_days: daysRemaining,
            updated_at: new Date().toISOString(),
          };

          // Only initialize days_remaining if it's 0 or null
          if (!current?.days_remaining || current.days_remaining === 0) {
            updatePayload.days_remaining = daysRemaining;
          }

          const { error: updateError } = await (supabase.from("aspirations") as any)
            .update(updatePayload)
            .eq("id", aspiration.id);

          if (updateError) {
            console.error("❌ Error saving deadline_days:", updateError);
          } else {
            console.log("✅ deadline_days and days_remaining saved");
          }
        }

        if (daysRemaining <= 0) {
          console.log("⚠️ Deadline has passed or is today");
          setGapData({
            completionPercentage: 100,
            daysRemaining: 0,
            requiredPace: 0,
            actualPace: 0,
            status: "behind",
            totalGoalsNeeded: 0,
            goalsCompleted: 0,
          });
          setLoading(false);
          return;
        }
      } catch (parseError) {
        console.error("❌ Error parsing deadline:", parseError);
        // If AI parsing fails, just show completion percentage
        daysRemaining = 0;
      }

      // 4. Get data from aspiration_progress table (first row for this user)
      const { data: progressData, error: progressError } = await (
        supabase.from("aspiration_progress") as any
      )
        .select("total_goals, completed_goals, completion_percentage")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (progressError || !progressData) {
        console.log("⚠️ No aspiration progress found");
        setLoading(false);
        return;
      }

      const totalGoalsNeeded = progressData.total_goals || 0;
      const goalsCompleted = progressData.completed_goals || 0;
      const completionPercentage = progressData.completion_percentage || 0;

      console.log("📊 Data from aspiration_progress table:", {
        totalGoalsNeeded,
        goalsCompleted,
        completionPercentage: `${completionPercentage}%`,
      });

      // 5. Calculate actual pace (goals completed per day since start)
      const createdAt = new Date(aspiration.created_at);
      const now = new Date();
      const daysSinceStart = Math.ceil(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const actualPace =
        daysSinceStart > 0 ? goalsCompleted / daysSinceStart : 0;

      // 6. Calculate required pace (only if we have a valid deadline)
      let requiredPace = 0;
      let status: "ahead" | "on-track" | "behind" = "behind";

      if (daysRemaining > 0) {
        const goalsRemaining = totalGoalsNeeded - goalsCompleted;
        requiredPace = daysRemaining > 0 ? goalsRemaining / daysRemaining : 0;

        // Determine status
        if (actualPace >= requiredPace) {
          status = "ahead";
        } else if (actualPace >= requiredPace * 0.8) {
          status = "on-track";
        }
      }

      console.log("📈 Gap calculation:", {
        completionPercentage,
        daysRemaining,
        requiredPace: requiredPace.toFixed(1),
        actualPace: actualPace.toFixed(1),
        status,
      });

      setGapData({
        completionPercentage,
        daysRemaining,
        requiredPace: Math.round(requiredPace * 10) / 10,
        actualPace: Math.round(actualPace * 10) / 10,
        status,
        totalGoalsNeeded,
        goalsCompleted,
      });
    } catch (error) {
      console.error("❌ Error calculating gap:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#1F9FFF" }]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

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
      ? "You are ahead of schedule!"
      : gapData.status === "on-track"
        ? "You are on track"
        : "You are behind schedule";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: "#1F9FFF", borderColor: "#1F9FFF" },
        Platform.OS === "ios" && {
          shadowColor: "#1F9FFF",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
    >
      <Text style={[styles.title, { color: "#FFFFFF" }]}>THE GAP</Text>

      {/* Completion Percentage */}
      <View style={styles.metric}>
        <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>
          Completion
        </Text>
        <Text style={[styles.value, { color: "#FFFFFF" }]}>
          {gapData.completionPercentage}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBar,
          { backgroundColor: "rgba(255,255,255,0.3)" },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(gapData.completionPercentage, 100)}%`,
              backgroundColor: "#FFFFFF",
            },
          ]}
        />
      </View>

      {/* Time Remaining */}
      <View style={styles.metric}>
        <Text style={[styles.value, { color: "#FFFFFF" }]}>
          {gapData.daysRemaining} days left
        </Text>
      </View>

      {/* Pace Analysis */}
      <View style={styles.paceContainer}>
        <View style={styles.paceItem}>
          <Text style={[styles.paceLabel, { color: "rgba(255,255,255,0.8)" }]}>
            Required Pace
          </Text>
          <Text style={[styles.paceValue, { color: "#FFFFFF" }]}>
            {gapData.requiredPace}/day
          </Text>
        </View>
        <View style={styles.paceItem}>
          <Text style={[styles.paceLabel, { color: "rgba(255,255,255,0.8)" }]}>
            Actual Pace
          </Text>
          <Text style={[styles.paceValue, { color: "#FFFFFF" }]}>
            {gapData.actualPace}/day
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <View
        style={[
          styles.statusMessage,
          {
            backgroundColor: "rgba(255,255,255,0.15)",
          },
        ]}
      >
        <MaterialCommunityIcons name={statusIcon} size={20} color="#FFFFFF" />
        <Text
          style={[
            styles.statusText,
            {
              color: "#FFFFFF",
            },
          ]}
        >
          {statusMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.6,
    height: 240,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  metric: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
  },
  paceContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  paceItem: {
    flex: 1,
    alignItems: "center",
  },
  paceLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },
  paceValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
});
