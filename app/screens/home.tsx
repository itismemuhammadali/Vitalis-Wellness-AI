import AspirationGapWidget from "@/app/components/AspirationGapWidget";
import {
    AchievementUnlockedPopup,
    StreakMilestonePopup,
    XPPopup
} from "@/app/components/GamificationComponents";
import GoalSetupModal from "@/app/components/GoalSetupModal";
import LogProgressModal from "@/app/components/LogProgressModal";
import { useAuth } from "@/app/context/AuthContext";
import { useGamification } from "@/app/context/GamificationContext";
import { ensureAspirationProgressInitialized } from "@/app/lib/updateAspirationProgress";
import BottomNavbar from "@/app/widgets/BottomNavbar";
import CompleteProfileModal from "@/app/widgets/CompleteProfileModal";
import LogActivityModal from "@/app/widgets/LogActivityModal";
import { useTheme } from "@/context/ThemeContext";
import { useTimeCapsule } from "@/context/TimeCapsuleContext";
import { supabase } from "@/lib/supabase";
import { profileQuestionService } from "@/services/profileQuestionService";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const PRIMARY_GREEN = "#58CC02";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const DARK_SUBTITLE = "#B0B0B0";
const LIGHT_SUBTITLE = "#757575";
const DARK_CARD_BG = "#1A2332";
const LIGHT_CARD_BG = "#FFFFFF";
const DARK_BORDER = "#2A3A4A";
const LIGHT_BORDER = "#E0E0E0";

interface SelfProfile {
  type: "current" | "better";
  photo?: string;
  metrics: {
    label: string;
    value: string;
  }[];
}

export default function HomeScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    state: gamificationState,
    logActivity,
    loadXPFromDatabase,
    getCurrentAchievement,
    loadStreakFromDatabase,
  } = useGamification();
  const { unlockTime, calculateCountdown, getUnlockDate, customDate } =
    useTimeCapsule();
  const [logActivityModalVisible, setLogActivityModalVisible] = useState(false);
  const [logProgressModalVisible, setLogProgressModalVisible] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] =
    useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [betterSelfAvatarUrl, setBetterSelfAvatarUrl] = useState<string | null>(
    null,
  );
  const [userAspirations, setUserAspirations] = useState<string[]>([]);
  const [completedGoals, setCompletedGoals] = useState(0);
  const [aspirationMetrics, setAspirationMetrics] = useState<Array<{
    label: string;
    currentValue: string;
    targetValue: string;
  }>>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [showStreakMilestonePopup, setShowStreakMilestonePopup] =
    useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [achievementData, setAchievementData] = useState({
    title: "",
    icon: "",
    xp: 0,
  });
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState("Beginner");
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarModalUrl, setAvatarModalUrl] = useState<string | null>(null);
  const [avatarModalTitle, setAvatarModalTitle] = useState("");
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [quizAnswersComplete, setQuizAnswersComplete] = useState(false);
  const [progressInitialized, setProgressInitialized] = useState(0);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Pulse animation for streak
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulseAnim]);

  // Slide in animation for gamification section
  useEffect(() => {
    const slideAnimation = Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    slideAnimation.start();

    return () => {
      slideAnimation.stop();
    };
  }, [slideAnim]);

  // Scale animation for cards
  useEffect(() => {
    const scaleAnimation = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    scaleAnimation.start();

    return () => {
      scaleAnimation.stop();
    };
  }, [scaleAnim]);

  // Show XP popup when it updates
  useEffect(() => {
    if (gamificationState.recentXPPopup) {
      setShowXPPopup(true);
      const timer = setTimeout(() => setShowXPPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gamificationState.recentXPPopup]);

  // Update achievement when XP changes
  useEffect(() => {
    setCurrentAchievement(getCurrentAchievement());
  }, [gamificationState.xp.totalXP, getCurrentAchievement]);

  const checkQuizCompletion = async () => {
    try {
      if (!user?.id) return;

      console.log("🔍 Checking quiz completion for user:", user.id);

      // Check if user has a session
      const { data: session } = await (
        supabase.from("goal_setup_sessions") as any
      )
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) {
        console.log("📝 No session found - showing quiz popup");
        setShowQuizPopup(true);
        return;
      }

      // Check if all questions have been answered
      const { data: questions } = await (
        supabase.from("goal_setup_questions") as any
      )
        .select("id")
        .eq("session_id", session.id);

      const { data: answers } = await (
        supabase.from("goal_setup_answers") as any
      )
        .select("id")
        .eq("session_id", session.id);

      const questionCount = questions?.length || 0;
      const answerCount = answers?.length || 0;

      if (questionCount === 0) {
        console.log("📝 No questions found - showing quiz popup");
        setShowQuizPopup(true);
      } else if (answerCount < questionCount) {
        console.log(
          `📝 Incomplete answers (${answerCount}/${questionCount}) - showing quiz popup`,
        );
        setShowQuizPopup(true);
      } else {
        console.log(
          `✅ Quiz completed (${answerCount}/${questionCount}) - hiding popup`,
        );
        setShowQuizPopup(false);
      }
    } catch (err) {
      console.error("Error checking quiz completion:", err);
    }
  };

  const checkAndShowProfileModal = async () => {
    try {
      if (!user?.id) return;
      // If arriving from onboarding, mark onboarding completed in AsyncStorage
      if (params.showGoalSetup === "true") {
        await AsyncStorage.setItem("onboardingCompleted", "true");
      }
      // Check DB: if goal_setup_sessions already exists, mark as completed
      const { data: sessions } = await (
        supabase.from("goal_setup_sessions") as any
      )
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (sessions) {
        await profileQuestionService.markProfileQuestionsCompleted();
        return;
      }
      const shouldShow =
        await profileQuestionService.shouldShowProfileQuestion();
      if (shouldShow) {
        setShowCompleteProfileModal(true);
        await profileQuestionService.markProfileQuestionShownAfterOnboarding();
      }
    } catch (err) {
      console.error("Error checking profile modal:", err);
    }
  };

  // Check if quiz popup should be shown
  useEffect(() => {
    // checkAndShowProfileModal(); // DISABLED - only show goal setup modal
    checkQuizCompletion();
  }, [user?.id]);

  const fetchUserAspirations = async () => {
    try {
      if (!user?.id) return;
      const { data } = await (supabase.from("aspirations") as any)
        .select("description")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(5);
      if (data && data.length > 0) {
        setUserAspirations(data.map((a: any) => a.description).filter(Boolean));
      }
    } catch (err) {
      console.error("Error fetching aspirations:", err);
    }
  };

  const fetchAspirationMetrics = async () => {
    try {
      if (!user?.id) return;
      setLoadingMetrics(true);
      
      console.log('📊 Fetching aspiration metrics...');
      
      // Call as regular HTTP endpoint to avoid JWT issues
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-aspiration-metrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        return;
      }

      const data = await response.json();

      if (data && data.success && data.metrics) {
        console.log('✅ Loaded aspiration metrics:', data.metrics);
        setAspirationMetrics(data.metrics);
      } else {
        console.log('⚠️ No metrics returned:', data);
      }
    } catch (err) {
      console.error('❌ Error in fetchAspirationMetrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchAvatarFromDatabase();
    fetchCompletedGoals();
    fetchUserAspirations();
    fetchAspirationMetrics();
    if (user?.id) {
      loadXPFromDatabase(user.id);
      loadStreakFromDatabase(user.id);
      ensureAspirationProgressInitialized(user.id).then(() => {
        setProgressInitialized((prev) => prev + 1);
      });
    }
  }, [user?.id, loadXPFromDatabase, loadStreakFromDatabase]);

  const fetchAvatarFromDatabase = async () => {
    try {
      if (!user?.id) return;

      const startTime = Date.now();

      const { data, error } = await (supabase.from("users") as any)
        .select("avatar_url, better_self_avatar_url")
        .eq("id", user.id)
        .single();

      const endTime = Date.now();

      if (error) {
        console.error("Error fetching avatars:", error);
      } else if (data) {
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
        if (data.better_self_avatar_url) {
          setBetterSelfAvatarUrl(data.better_self_avatar_url);
        }
      }
    } catch (err) {
      console.error("Error in fetchAvatarFromDatabase:", err);
    }
  };

  const fetchCompletedGoals = async () => {
    try {
      if (!user?.id) return;

      // Query aspiration_progress table for completed goals
      const { data, error } = await (
        supabase.from("aspiration_progress") as any
      )
        .select("completed_goals")
        .eq("user_id", user.id)
        .limit(1);

      if (error) {
        console.error("❌ Error fetching completed goals:", error);
        setCompletedGoals(0);
        return;
      }

      if (data && data.length > 0 && data[0].completed_goals) {
        setCompletedGoals(data[0].completed_goals);
      } else {
        setCompletedGoals(0);
      }
    } catch (err) {
      console.error("❌ Error in fetchCompletedGoals:", err);
      setCompletedGoals(0);
    }
  };

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  const handleLogProgress = () => {
    setLogProgressModalVisible(true);
  };

  const handleLogActivitySubmit = (data: any) => {
    logActivity(gamificationState.streak.currentStreak, false);
    setLogActivityModalVisible(false);
  };

  const handleStartQuiz = async () => {
    setShowQuizPopup(false);
    // Navigate to dynamic question screen with user's actual aspirations
    router.push({
      pathname: "/screens/dynamic-question",
      params: { aspirations: userAspirations.join(",") },
    });
  };

  const slideInStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: slideAnim,
  };

  const scaleStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerGreeting, { color: textColor }]}>
              Welcome Back 👋
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: subtitleColor }]}>
            Let's continue your journey
          </Text>
        </View>

        {/* CURRENT SELF vs BETTER SELF - ALWAYS ON TOP */}
        <View style={styles.splitScreenContainer}>
          {/* LEFT: Current Self */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setAvatarModalUrl(avatarUrl);
              setAvatarModalTitle("Current Self");
              setAvatarModalVisible(true);
            }}
            style={{ flex: 1 }}
          >
          <Animated.View
            style={[
              styles.selfCard,
              { backgroundColor: cardBg, borderColor },
              scaleStyle,
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
            <Text style={[styles.selfLabel, { color: subtitleColor }]}>
              CURRENT SELF
            </Text>

            {/* Photo Placeholder */}
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.photoPlaceholder}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: borderColor },
                ]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={48}
                  color={subtitleColor}
                />
              </View>
            )}

            {/* Metrics */}
            {aspirationMetrics.length > 0 && (
              <View style={styles.metricsContainer}>
                <Text style={[styles.metricLabel, { color: subtitleColor }]}>
                  {aspirationMetrics[0].label}
                </Text>
                <Text style={[styles.metricValue, { color: textColor }]}>
                  {aspirationMetrics[0].currentValue === "Not Set" ? "---" : aspirationMetrics[0].currentValue}
                </Text>
              </View>
            )}
          </Animated.View>
          </TouchableOpacity>

          {/* RIGHT: Better Self */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setAvatarModalUrl(betterSelfAvatarUrl);
              setAvatarModalTitle("Better Self");
              setAvatarModalVisible(true);
            }}
            style={{ flex: 1 }}
          >
          <Animated.View
            style={[
              styles.selfCard,
              { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN },
              scaleStyle,
              Platform.OS === "ios" && {
                shadowColor: "rgba(88, 204, 2, 0.3)",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 6,
              },
            ]}
          >
            <Text
              style={[styles.selfLabel, { color: "rgba(255,255,255,0.7)" }]}
            >
              BETTER SELF
            </Text>

            {/* Avatar Placeholder */}
            {betterSelfAvatarUrl ? (
              <Image
                source={{ uri: betterSelfAvatarUrl }}
                style={styles.photoPlaceholder}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <MaterialCommunityIcons name="star" size={48} color="#FFFFFF" />
              </View>
            )}

            {/* Metrics */}
            {aspirationMetrics.length > 0 && (
              <View style={styles.metricsContainer}>
                <Text style={[styles.metricLabel, { color: "rgba(255,255,255,0.7)" }]}>
                  {aspirationMetrics[0].label}
                </Text>
                <Text style={[styles.metricValue, { color: "#FFFFFF" }]}>
                  {aspirationMetrics[0].targetValue}
                </Text>
              </View>
            )}
          </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Talk to Better Self Button */}
        <TouchableOpacity
          style={[
            styles.betterSelfButton,
            Platform.OS === "ios" && {
              shadowColor: "rgba(88, 204, 2, 0.3)",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
            },
            Platform.OS === "android" && {
              elevation: 8,
            },
          ]}
          onPress={() => router.push("/screens/better-self-chat")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chat-processing"
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.betterSelfButtonText}>Chat or Speak with your better self</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* ASPIRATIONS & GAP WIDGET */}
        {user?.id && <AspirationGapWidget userId={user.id} refreshTrigger={progressInitialized} />}

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Log Activity Modal */}
      <LogActivityModal
        visible={logActivityModalVisible}
        onClose={() => setLogActivityModalVisible(false)}
        onSubmit={handleLogActivitySubmit}
      />

      {/* Log Progress Modal (Quick Action) */}
      {user?.id && (
        <LogProgressModal
          visible={logProgressModalVisible}
          userId={user.id}
          onClose={() => setLogProgressModalVisible(false)}
          onSuccess={() => {
            setLogProgressModalVisible(false);
            // Refetch completed goals after logging
            fetchCompletedGoals();
          }}
          onGoalCompleted={() => {
            // Refetch completed goals when a goal is completed
            fetchCompletedGoals();
          }}
          isQuickAction={true}
        />
      )}

      {/* XP Popup */}
      <XPPopup
        amount={gamificationState.recentXPPopup?.amount || 0}
        visible={showXPPopup}
        isDarkMode={isDarkMode}
      />

      {/* Streak Milestone Popup */}
      <StreakMilestonePopup
        visible={showStreakMilestonePopup}
        streakCount={gamificationState.streak.currentStreak}
        isDarkMode={isDarkMode}
        onDismiss={() => setShowStreakMilestonePopup(false)}
      />

      {/* Achievement Unlocked Popup */}
      <AchievementUnlockedPopup
        visible={showAchievementPopup}
        achievementTitle={achievementData.title}
        achievementIcon={achievementData.icon}
        xpReward={achievementData.xp}
        isDarkMode={isDarkMode}
        onDismiss={() => setShowAchievementPopup(false)}
      />

      {/* Bottom Navbar */}
      <BottomNavbar />

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        visible={showCompleteProfileModal}
        onStartNow={() => {
          setShowCompleteProfileModal(false);
          router.push({
            pathname: "/screens/dynamic-question",
            params: { aspirations: userAspirations.join(",") },
          });
        }}
        onAskMeLater={() => setShowCompleteProfileModal(false)}
      />

      {/* Goal Setup Modal (Quiz Popup) */}
      <GoalSetupModal
        visible={showQuizPopup}
        onClose={() => setShowQuizPopup(false)}
        onStart={handleStartQuiz}
        aspirations={
          userAspirations.length > 0
            ? userAspirations
            : ["Personal Growth", "Self Improvement"]
        }
      />

      {/* Avatar Full Screen Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
            {avatarModalTitle}
          </Text>
          {avatarModalUrl ? (
            <Image
              source={{ uri: avatarModalUrl }}
              style={{ width: 320, height: 520, borderRadius: 20 }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ width: 320, height: 520, borderRadius: 20, backgroundColor: "#1A2332", justifyContent: "center", alignItems: "center" }}>
              <MaterialCommunityIcons name={avatarModalTitle === "Better Self" ? "star" : "account"} size={80} color="#58CC02" />
              <Text style={{ color: "#B0B0B0", marginTop: 12, fontSize: 14 }}>No avatar yet</Text>
            </View>
          )}
          <Text style={{ color: "#B0B0B0", fontSize: 12, marginTop: 20 }}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerGreeting: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  splitScreenContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  selfCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selfLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  photoPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  metricsContainer: {
    marginTop: 8,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  betterSelfButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  betterSelfButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    flex: 1,
  },
  gapTimeCapsuleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  timeCapsuleCard: {
    flex: 0.45,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  timeCapsuleLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  timeCapsuleIcon: {
    marginBottom: 8,
  },
  timeCapsuleMessageType: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  timeCapsuleCountdown: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  timeCapsuleDate: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  timeCapsuleArrow: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  spacer: {
    height: 20,
  },
});
