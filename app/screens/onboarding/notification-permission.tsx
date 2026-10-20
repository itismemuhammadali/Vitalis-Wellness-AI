import { useAuth } from "@/app/context/AuthContext";
import { getNextOnboardingScreen } from "@/app/lib/onboardingNavigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
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
const BORDER_COLOR = "#2A3A4A";
const DARK_CARD = "#1A2A3A";

// Button style constants (reusable across all screens)
const BUTTON_BORDER_RADIUS = 25;
const BUTTON_PADDING_VERTICAL = 24;
const BUTTON_SHADOW_OFFSET = { width: 0, height: 10 };
const BUTTON_SHADOW_OPACITY = 0.5;
const BUTTON_SHADOW_RADIUS = 16;
const BUTTON_ELEVATION = 15;

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [notificationPermissionAsked, setNotificationPermissionAsked] =
    useState(false);
  const [jumpAnim] = useState(new Animated.Value(0));

  // Animation effect - MUST be before any early returns
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(jumpAnim, {
          toValue: -20,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [jumpAnim]);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD : "#F0F0F0";

  const handleAllowNotifications = async () => {
    try {
      // Show system permission alert
      Alert.alert(
        "Enable Notifications",
        "KYVO would like to send you notifications for reminders and motivational messages.",
        [
          {
            text: "Don't Allow",
            onPress: () => {
              setNotificationPermissionAsked(true);
            },
            style: "cancel",
          },
          {
            text: "Allow",
            onPress: async () => {
              // User allowed - save FCM token
              try {
                const {
                  data: { user },
                } = await supabase.auth.getUser();

                if (user) {
                  // Generate a token for Expo Go
                  const simpleToken = `expo_${user.id.substring(0, 8)}_${Date.now()}`;

                  // Save FCM token to Supabase
                  const { error } = await supabase.from("fcm_tokens").insert({
                    user_id: user.id,
                    fcm_token: simpleToken,
                    device_name: "mobile-device",
                  });

                  if (error) {
                    console.error("Error saving FCM token:", error);
                  } else {
                    console.log("FCM token saved successfully:", simpleToken);
                  }

                  // Automatically move to next step after permission granted
                  const nextScreen = await getNextOnboardingScreen(user.id);
                  if (nextScreen) {
                    router.push(nextScreen);
                  } else {
                    router.push("/screens/home");
                  }
                }
              } catch (error) {
                console.error("Error saving token after permission:", error);
                setNotificationPermissionAsked(true);
              }
            },
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setNotificationPermissionAsked(true);
    }
  };

  const handleDenyNotifications = () => {
    setNotificationPermissionAsked(true);
  };

  const handleContinue = async () => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    try {
      const nextScreen = await getNextOnboardingScreen(user.id);
      if (nextScreen) {
        router.push(nextScreen);
      } else {
        // All onboarding complete, go to home
        router.push("/screens/home");
      }
    } catch (error) {
      console.error("Error determining next screen:", error);
      router.push("/screens/onboarding/aspiration");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Onboarding Header with Progress */}
        <OnboardingHeader
          currentStep={1}
          totalSteps={5}
          onBack={() => router.push("/screens/onboarding/welcome")}
        />

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>
          Consistency is the Key
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          We'll support you with reminders so progress doesn't rely on
          motivation.
        </Text>

        {/* Notification Card */}
        <View style={[styles.notificationCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            "KYVO" Would Like to Send You Notifications
          </Text>
          <Text style={[styles.cardDescription, { color: subtitleColor }]}>
            KYVO sends you personalized reminders and motivational messages to
            help you stay on track with your goals and daily actions.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.denyButton, { borderColor: BORDER_COLOR }]}
              onPress={handleDenyNotifications}
            >
              <Text style={[styles.denyButtonText, { color: textColor }]}>
                Don't Allow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.allowButton, { backgroundColor: PRIMARY_GREEN }]}
              onPress={handleAllowNotifications}
            >
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
          </View>

          {/* Arrow Icon - Positioned under Allow button */}
          {!notificationPermissionAsked && (
            <Animated.View
              style={[
                styles.arrowUnderAllow,
                { transform: [{ translateY: jumpAnim }] },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-up"
                size={40}
                color={PRIMARY_GREEN}
              />
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <OnboardingButton
          onPress={handleContinue}
          disabled={!notificationPermissionAsked}
          buttonColor={PRIMARY_GREEN}
          disabledColor="#7A8A9A"
          shadowColor={PRIMARY_GREEN}
          disabledShadowColor="#7A8A9A"
        >
          Continue
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
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  notificationCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    position: "relative",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 26,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  denyButton: {
    flex: 1,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  allowButton: {
    flex: 1,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    borderRadius: BUTTON_BORDER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOffset: BUTTON_SHADOW_OFFSET,
    shadowOpacity: BUTTON_SHADOW_OPACITY,
    shadowRadius: BUTTON_SHADOW_RADIUS,
    elevation: BUTTON_ELEVATION,
  },
  allowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  arrowContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  arrowUnderAllow: {
    position: "absolute",
    bottom: -50,
    right: "25%",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
