import CapsuleDetailsModal from "@/app/components/CapsuleDetailsModal";
import { useAuth } from "@/app/context/AuthContext";
import { formatCountdown } from "@/app/lib/countdownFormatter";
import BottomNavbar from "@/app/widgets/BottomNavbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/context/ThemeContext";
import { useTimeCapsule } from "@/context/TimeCapsuleContext";
import { supabase } from "@/lib/supabase";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface TimeCapsule {
  id: string;
  message_type: "text" | "voice" | "video";
  message_text: string | null;
  message_url: string | null;
  unlock_date: string;
  unlocked_at: string | null;
  is_unlocked: boolean;
  created_at: string;
}

export default function SealedCapsulesScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { unlockTime, calculateCountdown, getUnlockDate } = useTimeCapsule();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchAllCapsules();
  }, []);

  const fetchAllCapsules = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await (supabase.from("time_capsules") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching capsules:", error);
        return;
      }

      if (data) {
        setCapsules(data);
      }
    } catch (error) {
      console.error("Error in fetchAllCapsules:", error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";

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

  const colorPalette = {
    red: "#FF6B6B",
    blue: "#1F9FFF",
    orange: "#FFB84D",
    purple: "#A78BFA",
    teal: "#00D9A3",
    darkOrange: "#FF8C00",
    green: "#58CC02",
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color={textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerIcon}>⏰</ThemedText>
              <ThemedText style={[styles.mainTitle, { color: textPrimary }]}>
                Time Capsules
              </ThemedText>
            </View>
            <View style={{ width: 24 }} />
          </View>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Unlock memories from the future
          </ThemedText>
        </View>

        {/* Sealed Capsules Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Sealed Capsules ({capsules.length})
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#58CC02" />
            </View>
          ) : capsules.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No time capsules yet
            </ThemedText>
          ) : (
            capsules.map((capsule, index) => {
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
              const countdownText = formatCountdown(capsule.unlock_date);

              // Shuffle colors based on index
              const colors = [
                colorPalette.green,
                colorPalette.blue,
                colorPalette.red,
                colorPalette.orange,
                colorPalette.purple,
                colorPalette.teal,
                colorPalette.darkOrange,
              ];
              const cardColor = isUnlocked
                ? colors[index % colors.length]
                : colorPalette.purple;

              return (
                <View
                  key={capsule.id}
                  style={[
                    styles.capsuleCard,
                    {
                      backgroundColor: cardColor,
                      borderColor: cardColor,
                    },
                    Platform.OS === "ios" && {
                      shadowColor: isUnlocked
                        ? colorPalette.green
                        : colorPalette.purple,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                    },
                    Platform.OS === "android" && {
                      elevation: 8,
                    },
                  ]}
                >
                  {/* Top Section: Icon, Title, Type, Lock */}
                  <View style={styles.topSection}>
                    <ThemedText style={styles.capsuleIcon}>
                      {typeIcons[capsule.message_type]}
                    </ThemedText>
                    <View style={styles.titleSection}>
                      <ThemedText
                        style={[styles.capsuleTitle, { color: "#FFFFFF" }]}
                      >
                        {typeLabels[capsule.message_type]}
                      </ThemedText>
                    </View>
                    <MaterialCommunityIcons
                      name={isUnlocked ? "lock-open" : "lock"}
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>

                  {/* Unlock Info Box */}
                  <View
                    style={[
                      styles.unlocksBox,
                      {
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderColor: "#FFFFFF",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="calendar"
                      size={20}
                      color="#FFFFFF"
                      style={styles.calendarIcon}
                    />
                    <View>
                      <ThemedText
                        style={[styles.unlocksTime, { color: "#FFFFFF" }]}
                      >
                        {isUnlocked
                          ? "Unlocked"
                          : `Unlocks in ${countdownText}`}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.unlocksDate,
                          { color: "rgba(255,255,255,0.8)" },
                        ]}
                      >
                        {unlocksDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Bottom Section: View Details and Delete */}
                  <View style={styles.bottomSection}>
                    <TouchableOpacity
                      style={[
                        styles.viewDetailsButton,
                        {
                          backgroundColor: colorPalette.blue,
                        },
                        Platform.OS === "ios" && {
                          shadowColor: colorPalette.blue,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        Platform.OS === "android" && {
                          elevation: 5,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/screens/capsule-detail",
                          params: { capsuleId: capsule.id },
                        })
                      }
                    >
                      <MaterialCommunityIcons
                        name="eye"
                        size={18}
                        color="#FFFFFF"
                        style={styles.buttonIcon}
                      />
                      <ThemedText
                        style={[styles.viewDetailsText, { color: "#FFFFFF" }]}
                      >
                        View Details
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        {
                          backgroundColor: colorPalette.red,
                        },
                        Platform.OS === "ios" && {
                          shadowColor: colorPalette.red,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        Platform.OS === "android" && {
                          elevation: 5,
                        },
                      ]}
                      onPress={() => {
                        Alert.alert(
                          "Delete Time Capsule",
                          "Are you sure you want to delete this time capsule?",
                          [
                            {
                              text: "Cancel",
                              onPress: () => {},
                              style: "cancel",
                            },
                            {
                              text: "Delete",
                              onPress: async () => {
                                try {
                                  const { error } = await (
                                    supabase.from("time_capsules") as any
                                  )
                                    .delete()
                                    .eq("id", capsule.id);

                                  if (error) {
                                    Alert.alert(
                                      "Error",
                                      "Failed to delete time capsule",
                                    );
                                    console.error("Delete error:", error);
                                  } else {
                                    console.log("✅ Time capsule deleted");
                                    // Refresh the list
                                    fetchAllCapsules();
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error deleting capsule:",
                                    error,
                                  );
                                  Alert.alert(
                                    "Error",
                                    "Failed to delete time capsule",
                                  );
                                }
                              },
                              style: "destructive",
                            },
                          ],
                        );
                      }}
                    >
                      <MaterialCommunityIcons
                        name="trash-can"
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Capsule Details Modal */}
      {selectedCapsule && (
        <CapsuleDetailsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          capsule={selectedCapsule}
        />
      )}

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
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3142",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
  capsuleCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    gap: 16,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingTop: 8,
  },
  capsuleIcon: {
    fontSize: 35,
    lineHeight: 56,
  },
  titleSection: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  capsuleTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  unlocksBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  calendarIcon: {
    marginRight: 4,
  },
  unlocksTime: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  unlocksDate: {
    fontSize: 13,
  },
  bottomSection: {
    flexDirection: "row",
    gap: 12,
  },
  viewDetailsButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  spacer: {
    height: 20,
  },
});
