import { useAuth } from "@/app/context/AuthContext";
import BottomNavbar from "@/app/widgets/BottomNavbar";
import EditProfileModal from "@/app/widgets/EditProfileModal";
import ThemeModal from "@/app/widgets/ThemeModal";
import LegalModal from "@/app/components/LegalModal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View
} from "react-native";

export default function SettingsScreen() {
  const { isDarkMode, setThemeMode, themeMode } = useTheme();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDarkMode);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy">("terms");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    dateOfBirth: "",
    aspiration: "",
  });

  // Load notification preference on mount
  useEffect(() => {
    loadNotificationPreference();
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("full_name, date_of_birth")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile data:", error);
        return;
      }

      // Load aspiration separately
      const { data: aspirationData, error: aspirationError } = await supabase
        .from("aspirations")
        .select("description")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (data) {
        setProfileData({
          fullName: data.full_name || "",
          dateOfBirth: data.date_of_birth || "",
          aspiration: aspirationData?.description || "",
        });
      }
    } catch (error) {
      console.error("Error in loadProfileData:", error);
    }
  };

  const loadNotificationPreference = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("notifications_enabled")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        setNotificationsEnabled(data.notifications_enabled);
      }
    } catch (error) {
      console.error("Error loading notification preference:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = useCallback(
    async (value: boolean) => {
      try {
        if (!user) return;

        setNotificationsEnabled(value);

        // Save to database
        const { error } = await supabase
          .from("user_preferences")
          .update({ notifications_enabled: value })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving notification preference:", error);
          // Revert on error
          setNotificationsEnabled(!value);
        }
      } catch (error) {
        console.error("Error updating notification preference:", error);
        setNotificationsEnabled(!value);
      }
    },
    [user],
  );

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const cardBg = isDarkMode ? "#1A1F2E" : "#FFFFFF";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)";

  // Gamification colors
  const colorPalette = {
    red: "#FF6B6B",
    blue: "#1F9FFF",
    orange: "#FFB84D",
    purple: "#A78BFA",
    teal: "#00D9A3",
    darkOrange: "#FF8C00",
    green: "#58CC02",
  };

  const handleDarkModeToggle = useCallback(
    (value: boolean) => {
      setDarkModeEnabled(value);
      setThemeMode(value ? "dark" : "light");
    },
    [setThemeMode],
  );

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/screens/authentication/login?toast=logged_out");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      if (!user?.id) return;
      setDeleting(true);
      const userId = user.id;

      console.log("🗑️ Calling delete-user for:", userId);
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      const fnData = await response.json();
      console.log("📦 Function response:", JSON.stringify(fnData));

      if (!response.ok) {
        console.error("❌ Delete function error:", fnData.error);
      }

      await signOut();
      router.replace("/screens/authentication/login?toast=account_deleted");
    } catch (error) {
      console.error("Delete account error:", error);
      setDeleting(false);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <ThemedText style={[styles.title, { color: textPrimary }]}>
          Settings
        </ThemedText>

        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Preferences
          </ThemedText>

          {/* Notifications - Blue to Teal Gradient (informational) */}
          <LinearGradient
            colors={["#1F9FFF", "#00D9A3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#1F9FFF",
              },
              Platform.OS === "ios" && {
                shadowColor: "#1F9FFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name={notificationsEnabled ? "bell" : "bell-off"}
                size={24}
                color="#FFFFFF"
                style={styles.settingIcon}
              />
              <View style={styles.settingInfo}>
                <ThemedText style={[styles.settingTitle, { color: "#FFFFFF" }]}>
                  Notifications
                </ThemedText>
                <ThemedText
                  style={[
                    styles.settingSubtitle,
                    { color: "rgba(255,255,255,0.8)" },
                  ]}
                >
                  Receive reminders and updates
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: "rgba(255,255,255,0.3)", true: "#FFFFFF" }}
              thumbColor={notificationsEnabled ? "#1F9FFF" : "#FFFFFF"}
            />
          </LinearGradient>

          {/* Dark Mode - Neutral Gray (system preference) */}
          <LinearGradient
            colors={["#6B7280", "#4B5563"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#6B7280",
              },
              Platform.OS === "ios" && {
                shadowColor: "#6B7280",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
            onPress={() => setThemeModalVisible(true)}
          >
            <TouchableOpacity
              onPress={() => setThemeModalVisible(true)}
              style={styles.settingCardContent}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    Dark Mode
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Easy on the eyes
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.arrowIcon, { color: "#FFFFFF" }]}>
                ›
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Account
          </ThemedText>

          {/* Edit Profile - Purple (personal data, medium importance) */}
          <LinearGradient
            colors={["#A78BFA", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#A78BFA",
              },
              Platform.OS === "ios" && {
                shadowColor: "#A78BFA",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setEditProfileModalVisible(true)}
              style={styles.settingCardContent}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="account-edit"
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    Edit Profile
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Update your information
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.arrowIcon, { color: "#FFFFFF" }]}>
                ›
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>

          {/* Change Password - Red (security-critical, high importance) */}
          <LinearGradient
            colors={["#FF6B6B", "#DC2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#FF6B6B",
              },
              Platform.OS === "ios" && {
                shadowColor: "#FF6B6B",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/screens/authentication/forgot-password?mode=change",
                )
              }
              style={styles.settingCardContent}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="lock"
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    Change Password
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Update your security
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.arrowIcon, { color: "#FFFFFF" }]}>
                ›
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Privacy & Security
          </ThemedText>

          {/* Privacy Policy - Orange (informational, low-medium importance) */}
          <LinearGradient
            colors={["#FFB84D", "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#FFB84D",
              },
              Platform.OS === "ios" && {
                shadowColor: "#FFB84D",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.settingCardContent}
              onPress={() => {
                setLegalModalType("privacy");
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="shield-alert"
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    Privacy Policy
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Read our privacy terms
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.arrowIcon, { color: "#FFFFFF" }]}>
                ›
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>

          {/* Terms & Conditions - Orange (informational, low-medium importance) */}
          <LinearGradient
            colors={["#FFB84D", "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#FFB84D",
              },
              Platform.OS === "ios" && {
                shadowColor: "#FFB84D",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.settingCardContent}
              onPress={() => {
                setLegalModalType("terms");
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="file-document"
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    Terms & Conditions
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Read our terms
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.arrowIcon, { color: "#FFFFFF" }]}>
                ›
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            About
          </ThemedText>

          {/* App Version - Gray (informational, low importance) */}
          <LinearGradient
            colors={["#6B7280", "#4B5563"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#6B7280",
              },
              Platform.OS === "ios" && {
                shadowColor: "#6B7280",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <View style={styles.settingCardContent}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="information"
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    App Version
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    v1.0.0
                  </ThemedText>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Help & Support - Blue (support/help, medium importance) */}
          <LinearGradient
            colors={["#1F9FFF", "#00D9A3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.settingCard,
              {
                borderColor: "#1F9FFF",
              },
              Platform.OS === "ios" && {
                shadowColor: "#1F9FFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              },
              Platform.OS === "android" && {
                elevation: 5,
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.settingCardContent}
              onPress={() => router.push("/screens/help-support")}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="help-circle"
                  size={24}
                  color="#FFFFFF"
                  style={styles.settingIcon}
                />
                <View style={styles.settingInfo}>
                  <ThemedText
                    style={[styles.settingTitle, { color: "#FFFFFF" }]}
                  >
                    Help & Support
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.settingSubtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Get help with KYVO
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.arrowIcon, { color: "#FFFFFF" }]}>
                ›
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colorPalette.red,
              borderColor: colorPalette.red,
            },
            Platform.OS === "ios" && {
              shadowColor: colorPalette.red,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            Platform.OS === "android" && {
              elevation: 6,
            },
          ]}
          onPress={handleLogout}
        >
          <ThemedText style={[styles.logoutButtonText, { color: "#FFFFFF" }]}>
            Logout
          </ThemedText>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            Platform.OS === "ios" && {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            },
            Platform.OS === "android" && {
              elevation: 3,
            },
          ]}
          onPress={handleDeleteAccount}
        >
          <MaterialCommunityIcons name="delete-forever" size={18} color="#FF6B6B" />
          <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
        </TouchableOpacity>

        {/* Spacer for navbar */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        initialData={{
          fullName: profileData.fullName,
          dateOfBirth: profileData.dateOfBirth,
          aspiration: profileData.aspiration,
        }}
        onSubmit={async (data: any) => {
          if (!user?.id) return;
          console.log("📝 onSubmit called, old aspiration:", profileData.aspiration);
          console.log("📝 new aspiration:", data.aspiration);
          try {
            // Save name and DOB to users table
            await supabase
              .from("users")
              .update({
                full_name: data.fullName,
                date_of_birth: data.dateOfBirth || null,
              })
              .eq("id", user.id);

            // If aspiration changed, trigger full refresh
            if (data.aspiration && data.aspiration.trim() !== profileData.aspiration.trim()) {
              console.log("🔄 Aspiration changed — triggering full refresh");
              const { refreshOnAspirationUpdate } = await import("@/app/lib/refreshOnAspirationUpdate");
              await refreshOnAspirationUpdate(user.id, data.aspiration);
            } else {
              console.log("ℹ️ Aspiration unchanged, skipping refresh");
            }

            // Update local state
            setProfileData({
              fullName: data.fullName,
              dateOfBirth: data.dateOfBirth,
              aspiration: data.aspiration,
            });

            console.log("✅ Profile saved");
          } catch (err) {
            console.error("Error saving profile:", err);
          }
        }}
      />

      {/* Theme Modal */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        themeSelection={themeMode}
        onThemeSelect={(theme: "light" | "dark" | "system") =>
          setThemeMode(theme)
        }
        isDarkMode={isDarkMode}
        textColor={textPrimary}
        subtitleColor={textSecondary}
        inputBgColor={cardBg}
      />

      {/* Legal Modal */}
      <LegalModal
        visible={legalModalVisible}
        type={legalModalType}
        onClose={() => setLegalModalVisible(false)}
      />

      {/* Bottom Navbar */}
      <BottomNavbar />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: cardBg }]}>
            <MaterialCommunityIcons name="delete-forever" size={48} color="#FF6B6B" />
            <ThemedText style={[styles.deleteModalTitle, { color: textPrimary }]}>
              Delete Account?
            </ThemedText>
            <ThemedText style={[styles.deleteModalMessage, { color: textSecondary }]}>
              This will permanently erase your account, goals, progress, and all personal data. This cannot be undone.
            </ThemedText>
            <TouchableOpacity
              style={[styles.deleteConfirmButton, deleting && { opacity: 0.6 }]}
              onPress={confirmDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.deleteConfirmText}>Yes, Delete Everything</ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteCancelButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              <ThemedText style={[styles.deleteCancelText, { color: textSecondary }]}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  arrowIcon: {
    fontSize: 24,
    fontWeight: "300",
  },
  logoutButton: {
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    backgroundColor: "transparent",
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  deleteModal: {
    width: "100%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteConfirmButton: {
    width: "100%",
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteConfirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteCancelButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  spacer: {
    height: 20,
  },
});
