import { useAuth } from "@/app/context/AuthContext";
import { getNextOnboardingScreen } from "@/app/lib/onboardingNavigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import OnboardingButton from "../../components/OnboardingButton";
import OnboardingHeader from "../../widgets/OnboardingHeader";

const PRIMARY_GREEN = "#58CC02";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const DARK_SUBTITLE = "#B0B0B0";
const LIGHT_SUBTITLE = "#757575";
const DARK_INPUT_BG = "#1A2332";
const LIGHT_INPUT_BG = "#FFFFFF";
const DARK_BORDER = "#2A3A4A";
const LIGHT_BORDER = "#E0E0E0";
const MAX_WORDS = 500;
const MAX_CHARACTERS = 3000;

export default function AspirationScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [aspiration, setAspiration] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingAspiration, setExistingAspiration] = useState<string | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;

  // Calculate word and character count
  const wordCount =
    aspiration.trim().length > 0 ? aspiration.trim().split(/\s+/).length : 0;
  const charCount = aspiration.length;
  const wordPercentage = (wordCount / MAX_WORDS) * 100;
  const isOverLimit = wordCount > MAX_WORDS;

  // Fetch existing aspiration on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!initialLoadComplete) {
        fetchExistingAspiration();
      }
    }, [user?.id, initialLoadComplete]),
  );

  const fetchExistingAspiration = async () => {
    try {
      if (!user?.id) {
        setInitialLoadComplete(true);
        return;
      }

      console.log("📝 Fetching existing aspiration for user:", user.id);
      const startTime = Date.now();

      const { data, error } = await (supabase.from("aspirations") as any)
        .select("description", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      const endTime = Date.now();
      console.log(`⏱️ Aspiration fetch took ${endTime - startTime}ms`);

      if (data) {
        console.log("✅ Found existing aspiration");
        setExistingAspiration(data.description);
        setAspiration("");
      } else {
        console.log("ℹ️ No existing aspiration found");
      }
    } catch (err) {
      console.log("No existing aspiration found");
    } finally {
      setInitialLoadComplete(true);
    }
  };

  const updateAspirationProgress = async (
    userId: string,
    aspiration: string,
  ) => {
    try {
      console.log("📊 Updating aspiration_progress...");

      // Get deadline_days from aspirations table
      const { data: aspirationData, error: aspError } = await (
        supabase.from("aspirations") as any
      )
        .select("deadline_days")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (aspError || !aspirationData) {
        console.log("⚠️ No aspiration found with deadline_days");
        return;
      }

      const deadlineDays = aspirationData.deadline_days || 0;
      const totalGoals = deadlineDays > 0 ? 5 * deadlineDays : 0; // 5 goals per day

      console.log(
        "🎯 Total goals calculated:",
        totalGoals,
        "(5 goals/day ×",
        deadlineDays,
        "days)",
      );

      const { data: logs, error: logsError } = await (
        supabase.from("daily_goal_logs") as any
      )
        .select("goal_id, status, completion_percentage")
        .eq("user_id", userId);

      const completedGoals =
        logs?.filter(
          (log: any) =>
            log.status === "completed" || log.completion_percentage === 100,
        ).length || 0;

      const completionPercentage =
        totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      console.log("📈 Progress calculation:", {
        totalGoals,
        completedGoals,
        completionPercentage,
      });

      const { data: existing, error: fetchError } = await (
        supabase.from("aspiration_progress") as any
      )
        .select("id")
        .eq("user_id", userId)
        .eq("aspiration", aspiration)
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await (
          supabase.from("aspiration_progress") as any
        )
          .update({
            total_goals: totalGoals,
            completed_goals: completedGoals,
            completion_percentage: completionPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("❌ Error updating aspiration_progress:", updateError);
        } else {
          console.log("✅ Updated aspiration_progress");
        }
      } else {
        const { error: insertError } = await (
          supabase.from("aspiration_progress") as any
        ).insert({
          user_id: userId,
          aspiration: aspiration,
          total_goals: totalGoals,
          completed_goals: completedGoals,
          completion_percentage: completionPercentage,
        });

        if (insertError) {
          console.error("❌ Error inserting aspiration_progress:", insertError);
        } else {
          console.log("✅ Created aspiration_progress record");
        }
      }
    } catch (error) {
      console.error("❌ Error in updateAspirationProgress:", error);
    }
  };

  const handleContinue = async () => {
    if (existingAspiration && !isEditing) {
      // Aspiration already exists, always go to deadline next
      router.push("/screens/onboarding/deadline");
      return;
    }

    const aspirationToSave = isEditing
      ? aspiration
      : existingAspiration || aspiration;

    if (!aspirationToSave?.trim()) {
      Alert.alert("Error", "Please enter your aspiration");
      return;
    }

    const words = aspirationToSave.trim().split(/\s+/).length;
    if (words > MAX_WORDS) {
      Alert.alert(
        "Error",
        `Your aspiration exceeds the ${MAX_WORDS} word limit. Currently at ${words} words.`,
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);

      if (existingAspiration && isEditing) {
        const { error } = await (supabase.from("aspirations") as any)
          .update({
            description: aspirationToSave.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) {
          Alert.alert("Error", error.message || "Failed to update aspiration");
          return;
        }

        console.log("✅ Aspiration updated");
        await updateAspirationProgress(user.id, aspirationToSave.trim());
      } else {
        const { error } = await (supabase.from("aspirations") as any).insert({
          user_id: user.id,
          description: aspirationToSave.trim(),
          status: "active",
        });

        if (error) {
          Alert.alert("Error", error.message || "Failed to save aspiration");
          return;
        }

        console.log("✅ Aspiration created");
        await updateAspirationProgress(user.id, aspirationToSave.trim());
      }

      // Always go to deadline after aspiration
      router.push("/screens/onboarding/deadline");
    } catch (err: any) {
      Alert.alert("Error", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setAspiration(existingAspiration || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setAspiration("");
    setIsEditing(false);
  };

  const hasAspiration = aspiration.trim().length > 0 || existingAspiration;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
      >
        <OnboardingHeader
          currentStep={2}
          totalSteps={5}
          onBack={() =>
            router.push("/screens/onboarding/notification-permission")
          }
        />

        <Text style={[styles.icon]}>✨</Text>
        <Text style={[styles.title, { color: textColor }]}>
          Your Aspiration
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          What is the one thing that would complete your life? What do you want
          most?
        </Text>

        {existingAspiration && !isEditing && (
          <View
            style={[
              styles.existingAspirationCard,
              { backgroundColor: isDarkMode ? "#1A3A2A" : "#E8F5E9" },
            ]}
          >
            <Text style={[styles.existingLabel, { color: PRIMARY_GREEN }]}>
              📌 This is the aspiration you used before
            </Text>
            <Text style={[styles.existingAspirationText, { color: textColor }]}>
              {existingAspiration}
            </Text>
            <View style={styles.existingButtonsContainer}>
              <TouchableOpacity
                style={[styles.editButton, { borderColor: PRIMARY_GREEN }]}
                onPress={handleEditClick}
              >
                <Text style={[styles.editButtonText, { color: PRIMARY_GREEN }]}>
                  ✏️ Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!existingAspiration || isEditing ? (
          <>
            <View
              style={[
                styles.thinkBigCard,
                { backgroundColor: isDarkMode ? "#1A2332" : "#F0F8FF" },
              ]}
            >
              <Text style={[styles.thinkBigLabel, { color: PRIMARY_GREEN }]}>
                💡 Think Big
              </Text>
              <Text style={[styles.thinkBigText, { color: subtitleColor }]}>
                There are no limitations to what you can think of. Dream without
                boundaries. Even if your goal seems impossible right now, write
                it down. We'll help you break it into achievable steps.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    color: textColor,
                    borderColor: isOverLimit
                      ? "#FF6B6B"
                      : aspiration.trim().length > 0
                        ? PRIMARY_GREEN
                        : borderColor,
                  },
                ]}
                placeholder="e.g., Build a successful business, Lose weight, Find true love, Travel the world..."
                placeholderTextColor={subtitleColor}
                value={aspiration}
                onChangeText={setAspiration}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />

              <View style={styles.counterContainer}>
                <View style={styles.counterStats}>
                  <Text
                    style={[
                      styles.counterText,
                      { color: isOverLimit ? "#FF6B6B" : subtitleColor },
                    ]}
                  >
                    {wordCount} / {MAX_WORDS} words
                  </Text>
                  <Text style={[styles.counterText, { color: subtitleColor }]}>
                    {charCount} / {MAX_CHARACTERS} characters
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: isDarkMode ? "#2A3A4A" : "#E0E0E0" },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(wordPercentage, 100)}%`,
                        backgroundColor: isOverLimit
                          ? "#FF6B6B"
                          : wordPercentage > 80
                            ? "#FFB84D"
                            : PRIMARY_GREEN,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.hint, { color: subtitleColor }]}>
              Be specific about what matters most to you. This will guide your
              journey with your better self.
            </Text>

            {isEditing && (
              <TouchableOpacity
                style={[styles.cancelEditButton, { borderColor: "#FF6B6B" }]}
                onPress={handleCancelEdit}
              >
                <Text
                  style={[styles.cancelEditButtonText, { color: "#FF6B6B" }]}
                >
                  Cancel Edit
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              {isEditing
                ? "Updating your aspiration..."
                : "Saving your aspiration..."}
            </Text>
          </View>
        )}
        <OnboardingButton
          onPress={handleContinue}
          disabled={!hasAspiration || loading || isOverLimit}
          buttonColor={PRIMARY_GREEN}
          disabledColor="#7A8A9A"
          shadowColor={PRIMARY_GREEN}
          disabledShadowColor="#7A8A9A"
        >
          {loading ? (isEditing ? "Updating..." : "Saving...") : "Continue"}
        </OnboardingButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 100,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  icon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "500",
    minHeight: 120,
  },
  counterContainer: {
    marginTop: 12,
    gap: 8,
  },
  counterStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  thinkBigCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  thinkBigLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  thinkBigText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  existingAspirationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  existingLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  existingAspirationText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 16,
  },
  existingButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelEditButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
