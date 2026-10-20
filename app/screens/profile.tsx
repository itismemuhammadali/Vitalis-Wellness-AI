import GoalSetupModal from "@/app/components/GoalSetupModal";
import { useAuth } from "@/app/context/AuthContext";
import { useGamification } from "@/app/context/GamificationContext";
import { formatCountdown } from "@/app/lib/countdownFormatter";
import BottomNavbar from "@/app/widgets/BottomNavbar";
import CompleteProfileModal from "@/app/widgets/CompleteProfileModal";
import EditProfileModal from "@/app/widgets/EditProfileModal";
import EditProfilePictureModal from "@/app/widgets/EditProfilePictureModal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAvatars } from "@/context/AvatarContext";
import { useAvatarUpdate } from "@/context/AvatarUpdateContext";
import { useOnboardingAvatar } from "@/context/OnboardingAvatarContext";
import { usePostOnboarding } from "@/context/PostOnboardingContext";
import { useTheme } from "@/context/ThemeContext";
import { useTimeCapsule } from "@/context/TimeCapsuleContext";
import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/utils/ageCalculator";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface Achievement {
  id: string;
  icon: string;
  label: string;
  unlocked: boolean;
}

interface TimeCapsule {
  id: string;
  message_type: "text" | "voice" | "video";
  message_text: string | null;
  unlock_date: string;
  is_unlocked: boolean;
  created_at: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "1", icon: "🚀", label: "Beginner", unlocked: true },
  { id: "2", icon: "🎯", label: "Achiever", unlocked: false },
  { id: "3", icon: "🔥", label: "Streakholder", unlocked: false },
  { id: "4", icon: "💎", label: "Consistent", unlocked: false },
  { id: "5", icon: "🏆", label: "Elite", unlocked: false },
  { id: "6", icon: "👑", label: "King", unlocked: false },
];

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { user, onboardingCompleted } = useAuth();
  const { state: gamificationState, loadXPFromDatabase } = useGamification();
  const { setNavigationSource } = usePostOnboarding();
  const { unlockTime, calculateCountdown } = useTimeCapsule();
  const { avatars } = useAvatars();
  const { avatarUri: onboardingAvatarUri } = useOnboardingAvatar();
  const { profilePicture, loadProfilePicture, setProfilePictureCustom } =
    useAvatarUpdate();
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfilePictureModalVisible, setEditProfilePictureModalVisible] =
    useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileQuestionVisible, setProfileQuestionVisible] = useState(false);
  const [userName, setUserName] = useState("User Name");
  const [userDateOfBirth, setUserDateOfBirth] = useState<string | null>(null);
  const [userAspiration, setUserAspiration] = useState<string>("");
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalSetupModal, setShowGoalSetupModal] = useState(false);
  const [userAspirations, setUserAspirations] = useState<string[]>([]);

  useEffect(() => {
    loadProfilePicture();
    fetchUserData();
    fetchTimeCapsules();
    fetchUserAspirations();
    if (user?.id) {
      loadXPFromDatabase(user.id);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await (supabase.from("users") as any)
        .select("full_name, date_of_birth, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (data) {
        setUserName(data.full_name || "User Name");
        setUserDateOfBirth(data.date_of_birth || null);
        // Load avatar from database
        if (data.avatar_url) {
          console.log("✅ Loading avatar from database:", data.avatar_url);
          setProfileImageUri(data.avatar_url);
        }
      }

      // Load current aspiration
      const { data: aspirationData, error: aspirationError } = await (
        supabase.from("aspirations") as any
      )
        .select("description")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (aspirationData) {
        setUserAspiration(aspirationData.description || "");
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    }
  };

  const fetchTimeCapsules = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await (supabase.from("time_capsules") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching time capsules:", error);
        return;
      }

      if (data) {
        setTimeCapsules(data);
      }
    } catch (error) {
      console.error("Error in fetchTimeCapsules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAspirations = async () => {
    try {
      if (!user?.id) return;

      console.log("📝 Fetching aspirations for user:", user.id);
      const { data, error } = await (supabase.from("aspirations") as any)
        .select("description")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching aspirations:", error);
        setUserAspirations([]);
      } else if (data && data.length > 0) {
        const aspirations = data.map((item: any) => item.description);
        console.log("✅ Aspirations loaded:", aspirations);
        setUserAspirations(aspirations);
      } else {
        console.log("ℹ️ No aspirations found");
        setUserAspirations([]);
      }
    } catch (err) {
      console.error("Error in fetchUserAspirations:", err);
      setUserAspirations([]);
    }
  };

  const handleStartGoalSetup = async () => {
    setShowGoalSetupModal(false);
    // Navigate to dynamic question screen with user's actual aspirations
    router.push({
      pathname: "/screens/dynamic-question",
      params: { aspirations: userAspirations.join(",") },
    });
  };

  useEffect(() => {
    // Reload profile picture when modal closes
    if (!editProfilePictureModalVisible) {
      fetchUserData();
    }
  }, [editProfilePictureModalVisible]);

  useEffect(() => {
    // First check if there's an onboarding avatar
    if (onboardingAvatarUri) {
      setProfileImageUri(onboardingAvatarUri);
      return;
    }

    if (profilePicture?.type === "avatar" && profilePicture?.avatarId) {
      const avatar = avatars.find((a) => a.id === profilePicture.avatarId);
      if (avatar) {
        setProfileImageUri(avatar.uri);
      }
    } else if (profilePicture?.type === "custom" && profilePicture?.customUri) {
      setProfileImageUri(profilePicture.customUri);
    }
  }, [profilePicture, avatars, onboardingAvatarUri]);

  const handleProfilePictureSelected = async (uri: string) => {
    try {
      console.log("Setting profile picture:", uri);

      // Save to database
      if (user?.id) {
        const { error: updateError } = await (supabase.from("users") as any)
          .update({ avatar_url: uri })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating avatar in database:", updateError);
          return;
        }
        console.log("✅ Avatar saved to database");
      }

      // Also save to AsyncStorage for offline access
      await setProfilePictureCustom(uri);
      console.log("Profile picture set, updating local state");
      setProfileImageUri(uri);
      // Reload to ensure it's persisted
      await loadProfilePicture();
      console.log("Profile picture reloaded");
    } catch (error) {
      console.error("Failed to set profile picture:", error);
    }
  };

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const cardBg = isDarkMode ? "#1A1F2E" : "#FFFFFF";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)";

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.profileCircle,
              {
                borderColor: "#58CC02",
              },
            ]}
          >
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.profileImage}
              />
            ) : (
              <ThemedText style={styles.profileIcon}>👤</ThemedText>
            )}
            <TouchableOpacity
              style={[styles.editIconContainer, { backgroundColor: "#58CC02" }]}
              onPress={() => setEditProfilePictureModalVisible(true)}
            >
              <ThemedText style={styles.editIcon}>✏️</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={[styles.userName, { color: textPrimary }]}>
              {userName}
            </ThemedText>
            <ThemedText style={[styles.userAge, { color: textSecondary }]}>
              Age {userDateOfBirth ? calculateAge(userDateOfBirth) : "N/A"}
            </ThemedText>
          </View>
        </View>

        {/* Level Card - Gamified */}
        <View
          style={[
            styles.levelCard,
            {
              backgroundColor: "#58CC02",
              borderColor: "#58CC02",
            },
            Platform.OS === "ios" && {
              shadowColor: "#58CC02",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
            },
            Platform.OS === "android" && {
              elevation: 8,
            },
          ]}
        >
          <ThemedText style={[styles.levelTitle, { color: "#FFFFFF" }]}>
            Level {Math.floor(gamificationState.xp.totalXP / 50) + 1}
          </ThemedText>
          <ThemedText
            style={[styles.levelXP, { color: "rgba(255,255,255,0.9)" }]}
          >
            {gamificationState.xp.totalXP} /{" "}
            {gamificationState.xp.totalXP + gamificationState.xp.xpToNextLevel}{" "}
            XP
          </ThemedText>
          <View
            style={[
              styles.xpBar,
              {
                backgroundColor: "rgba(255,255,255,0.3)",
              },
            ]}
          >
            <View
              style={[
                styles.xpFill,
                {
                  width: `${gamificationState.xp.levelProgress}%`,
                  backgroundColor: "#FFFFFF",
                },
              ]}
            />
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Achievements
          </ThemedText>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement, index) => {
              const colors = [
                "#FF6B6B",
                "#1F9FFF",
                "#FFB84D",
                "#A78BFA",
                "#00D9A3",
                "#FF8C00",
              ];
              const color = colors[index % colors.length];
              return (
                <TouchableOpacity
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: achievement.unlocked ? color : cardBg,
                      borderColor: achievement.unlocked ? color : borderColor,
                      borderWidth: 2,
                    },
                    achievement.unlocked &&
                      Platform.OS === "ios" && {
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                      },
                    achievement.unlocked &&
                      Platform.OS === "android" && {
                        elevation: 5,
                      },
                  ]}
                >
                  <ThemedText style={styles.achievementIcon}>
                    {achievement.icon}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.achievementLabel,
                      {
                        color: achievement.unlocked ? "#FFFFFF" : textSecondary,
                      },
                    ]}
                  >
                    {achievement.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Your Capsules Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Your Capsules
          </ThemedText>
          {timeCapsules.slice(0, 2).map((capsule) => {
            const typeIcons: { [key: string]: string } = {
              text: "💬",
              voice: "🎤",
              video: "🎥",
            };
            const typeLabels: { [key: string]: string } = {
              text: "Text Message",
              voice: "Voice Message",
              video: "Video Message",
            };

            const unlocksDate = new Date(capsule.unlock_date);
            const now = new Date();
            // For DATE type comparison, compare just the dates
            const todayDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const unlockDateOnly = new Date(
              unlocksDate.getFullYear(),
              unlocksDate.getMonth(),
              unlocksDate.getDate(),
            );
            const isUnlocked =
              capsule.is_unlocked || unlockDateOnly <= todayDate;
            const countdownText = isUnlocked
              ? "Unlocked"
              : `Unlocks in ${formatCountdown(capsule.unlock_date)}`;

            return (
              <TouchableOpacity
                key={capsule.id}
                style={[
                  styles.capsuleCard,
                  {
                    backgroundColor: "#1F9FFF",
                    borderColor: "#1F9FFF",
                  },
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
                onPress={() =>
                  router.push({
                    pathname: "/screens/capsule-detail",
                    params: { capsuleId: capsule.id },
                  })
                }
              >
                <ThemedText style={styles.capsuleIcon}>
                  {typeIcons[capsule.message_type]}
                </ThemedText>
                <View style={styles.capsuleInfo}>
                  <ThemedText
                    style={[styles.capsuleTitle, { color: "#FFFFFF" }]}
                  >
                    {typeLabels[capsule.message_type]}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.capsuleType,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    {countdownText}
                  </ThemedText>
                </View>
                <View style={styles.capsuleRight}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
          {timeCapsules.length === 0 && (
            <ThemedText
              style={[styles.noCapsuleText, { color: textSecondary }]}
            >
              No time capsules yet. Create one on the onboarding screen!
            </ThemedText>
          )}
          {timeCapsules.length > 2 && (
            <TouchableOpacity
              style={[
                styles.viewCapsuleButton,
                {
                  backgroundColor: "transparent",
                },
              ]}
              onPress={() => router.push("/screens/sealed-capsules")}
            >
              <ThemedText
                style={[styles.viewCapsuleText, { color: "#1F9FFF" }]}
              >
                View All Capsules ({timeCapsules.length}) →
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[
            styles.editProfileButton,
            {
              borderColor: "#A78BFA",
              borderWidth: 2,
            },
          ]}
          onPress={() => setEditProfileModalVisible(true)}
        >
          <ThemedText
            style={[styles.editProfileButtonText, { color: "#A78BFA" }]}
          >
            Edit Profile
          </ThemedText>
        </TouchableOpacity>

        {/* Complete Your Profile Button - Only show after onboarding is complete */}
        {onboardingCompleted && (
          <TouchableOpacity
            style={[
              styles.completeProfileButton,
              {
                backgroundColor: "#A78BFA",
              },
              Platform.OS === "ios" && {
                shadowColor: "#A78BFA",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
              },
              Platform.OS === "android" && {
                elevation: 8,
              },
            ]}
            onPress={() => setShowGoalSetupModal(true)}
          >
            <MaterialCommunityIcons
              name="account-check"
              size={20}
              color="#FFFFFF"
            />
            <ThemedText
              style={[styles.completeProfileButtonText, { color: "#FFFFFF" }]}
            >
              Complete Your Profile
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Spacer for navbar */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        initialData={{
          fullName: userName,
          dateOfBirth: userDateOfBirth || "",
          aspiration: userAspiration,
        }}
        onSubmit={async (data) => {
          try {
            if (!user?.id) return;

            const updateData: any = {
              full_name: data.fullName,
              updated_at: new Date().toISOString(),
            };

            // Only include date_of_birth if it's not empty
            if (data.dateOfBirth && data.dateOfBirth.trim()) {
              updateData.date_of_birth = data.dateOfBirth;
            } else {
              updateData.date_of_birth = null;
            }

            const { error } = await (supabase.from("users") as any)
              .update(updateData)
              .eq("id", user.id);

            if (error) {
              console.error("Error updating profile:", error);
              alert("Failed to update profile");
              return;
            }

            // Update aspiration if changed
            if (data.aspiration !== userAspiration) {
              const { error: aspirationError } = await (
                supabase.from("aspirations") as any
              )
                .update({
                  description: data.aspiration,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id)
                .eq("status", "active");

              if (aspirationError) {
                console.error("Error updating aspiration:", aspirationError);
              }
            }

            // Update local state
            setUserName(data.fullName);
            setUserDateOfBirth(data.dateOfBirth || null);
            setUserAspiration(data.aspiration);

            alert("Profile updated successfully!");
            setEditProfileModalVisible(false);
          } catch (error) {
            console.error("Error in profile update:", error);
            alert("An error occurred while updating profile");
          }
        }}
      />

      {/* Edit Profile Picture Modal */}
      <EditProfilePictureModal
        visible={editProfilePictureModalVisible}
        onClose={() => setEditProfilePictureModalVisible(false)}
        onImageSelected={handleProfilePictureSelected}
      />

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        visible={profileQuestionVisible}
        onStartNow={() => {
          setNavigationSource("profile");
          setProfileQuestionVisible(false);
          router.push("/screens/home");
        }}
        onAskMeLater={() => {
          setProfileQuestionVisible(false);
        }}
      />

      {/* Goal Setup Modal */}
      <GoalSetupModal
        visible={showGoalSetupModal}
        onClose={() => setShowGoalSetupModal(false)}
        onStart={handleStartGoalSetup}
        aspirations={
          userAspirations.length > 0
            ? userAspirations
            : ["Personal Growth", "Self Improvement"]
        }
      />

      {/* Bottom Navbar */}
      <BottomNavbar />
    </ThemedView>
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
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginBottom: 12,
    position: "relative",
    overflow: "visible",
  },
  profileIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    fontSize: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  userAge: {
    fontSize: 14,
  },
  levelCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  levelXP: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    width: "30.7%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "visible",
  },
  achievementIcon: {
    fontSize: 39,
    marginBottom: 8,
    top: 10,
    lineHeight: 72,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  capsuleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
    minHeight: 80,
  },
  capsuleIcon: {
    fontSize: 32,
    lineHeight: 40,
  },
  capsuleInfo: {
    flex: 1,
  },
  capsuleTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  capsuleType: {
    fontSize: 13,
  },
  capsuleRight: {
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 20,
  },
  viewCapsuleButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewCapsuleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noCapsuleText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  editProfileButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  completeProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
  },
  completeProfileButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  spacer: {
    height: 20,
  },
});
