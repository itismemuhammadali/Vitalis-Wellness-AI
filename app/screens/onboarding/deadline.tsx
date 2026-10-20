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
    View
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
const MAX_CHARACTERS = 200;

export default function DeadlineScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;

  // Calculate character count
  const charCount = deadline.length;
  const charPercentage = (charCount / MAX_CHARACTERS) * 100;
  const isOverLimit = charCount > MAX_CHARACTERS;

  // Fetch existing deadline on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!initialLoadComplete) {
        fetchExistingDeadline();
      }
    }, [user?.id, initialLoadComplete]),
  );

  const fetchExistingDeadline = async () => {
    try {
      if (!user?.id) {
        setInitialLoadComplete(true);
        return;
      }

      console.log("📅 Fetching existing deadline for user:", user.id);

      const { data, error } = await (supabase.from("aspirations") as any)
        .select("deadline")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (data?.deadline) {
        console.log("✅ Found existing deadline:", data.deadline);
        setDeadline(data.deadline);
      } else {
        console.log("ℹ️ No existing deadline found");
      }
    } catch (err) {
      console.error("Error fetching deadline:", err);
    } finally {
      setInitialLoadComplete(true);
    }
  };

  const handleContinue = async () => {
    if (!deadline.trim()) {
      Alert.alert("Error", "Please enter when you want to achieve this");
      return;
    }

    if (isOverLimit) {
      Alert.alert(
        "Error",
        `Your deadline exceeds the ${MAX_CHARACTERS} character limit. Currently at ${charCount} characters.`,
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);

      // Call parse-deadline edge function to get the number of days
      let deadlineDays = 0;
      try {
        const parseResponse = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/parse-deadline`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ deadlineText: deadline.trim() }),
          },
        );
        if (parseResponse.ok) {
          const result = await parseResponse.json();
          deadlineDays = result.daysFromNow || 0;
          console.log(`📅 Parsed deadline: ${deadlineDays} days`);
        }
      } catch (parseErr) {
        console.error("Error parsing deadline:", parseErr);
      }

      const { error } = await (supabase.from("aspirations") as any)
        .update({
          deadline: deadline.trim(),
          ...(deadlineDays > 0 && {
            deadline_days: deadlineDays,
            days_remaining: deadlineDays,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        Alert.alert("Error", error.message || "Failed to save deadline");
        return;
      }

      console.log("✅ Deadline saved successfully");

      // Always go to avatar-creation after deadline
      router.push("/screens/onboarding/avatar-creation");
    } catch (err: any) {
      Alert.alert("Error", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const hasDeadline = deadline.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
      >
        <OnboardingHeader
          currentStep={3}
          totalSteps={5}
          onBack={() => router.push("/screens/onboarding/aspiration")}
        />

        <Text style={[styles.icon]}>⏰</Text>
        <Text style={[styles.title, { color: textColor }]}>
          When do you want to achieve this?
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Tell us your timeline in your own words. Be as specific or flexible as
          you want.
        </Text>

        <View
          style={[
            styles.examplesCard,
            { backgroundColor: isDarkMode ? "#1A2332" : "#F0F8FF" },
          ]}
        >
          <Text style={[styles.examplesLabel, { color: PRIMARY_GREEN }]}>
            💡 Examples
          </Text>
          <Text style={[styles.examplesText, { color: subtitleColor }]}>
            • Within 6 months{"\n"}• By next summer{"\n"}• In 1 year{"\n"}•
            Within 90 days{"\n"}• By the end of this year
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
                  : deadline.trim().length > 0
                    ? PRIMARY_GREEN
                    : borderColor,
              },
            ]}
            placeholder="e.g., Within 6 months, By next summer, In 1 year..."
            placeholderTextColor={subtitleColor}
            value={deadline}
            onChangeText={setDeadline}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!loading}
          />

          <View style={styles.counterContainer}>
            <Text
              style={[
                styles.counterText,
                { color: isOverLimit ? "#FF6B6B" : subtitleColor },
              ]}
            >
              {charCount} / {MAX_CHARACTERS} characters
            </Text>

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
                    width: `${Math.min(charPercentage, 100)}%`,
                    backgroundColor: isOverLimit
                      ? "#FF6B6B"
                      : charPercentage > 80
                        ? "#FFB84D"
                        : PRIMARY_GREEN,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.hint, { color: subtitleColor }]}>
          This helps us understand your timeline and create a realistic plan for
          your journey.
        </Text>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Saving your deadline...
            </Text>
          </View>
        )}
        <OnboardingButton
          onPress={handleContinue}
          disabled={!hasDeadline || loading || isOverLimit}
          buttonColor={PRIMARY_GREEN}
          disabledColor="#7A8A9A"
          shadowColor={PRIMARY_GREEN}
          disabledShadowColor="#7A8A9A"
        >
          {loading ? "Saving..." : "Continue"}
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
  examplesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  examplesLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  examplesText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
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
    minHeight: 100,
  },
  counterContainer: {
    marginTop: 12,
    gap: 8,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 4,
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
});
