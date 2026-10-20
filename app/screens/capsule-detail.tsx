import { formatCountdown } from "@/app/lib/countdownFormatter";
import BottomNavbar from "@/app/widgets/BottomNavbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Video } from "expo-av";
import * as Audio from "expo-av/build/Audio";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function CapsuleDetailScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const capsuleId = params.capsuleId as string;

  const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    fetchCapsuleDetail();

    return () => {
      if (audioSound) {
        audioSound.unloadAsync();
      }
    };
  }, [capsuleId]);

  const fetchCapsuleDetail = async () => {
    try {
      if (!capsuleId) return;

      const { data, error } = await (supabase.from("time_capsules") as any)
        .select(
          "id, message_type, message_text, message_url, unlock_date, unlocked_at, is_unlocked, created_at",
        )
        .eq("id", capsuleId)
        .single();

      if (error) {
        console.error("Error fetching capsule:", error);
        return;
      }

      if (data) {
        console.log("📦 Capsule data fetched:", {
          id: data.id,
          unlock_date: data.unlock_date,
          unlocked_at: data.unlocked_at,
          is_unlocked: data.is_unlocked,
          created_at: data.created_at,
        });
        setCapsule(data);
      }
    } catch (error) {
      console.error("Error in fetchCapsuleDetail:", error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    try {
      if (!capsule?.message_url) return;

      if (audioSound) {
        await audioSound.stopAsync();
        setIsPlayingAudio(false);
        setAudioSound(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: capsule.message_url },
        { shouldPlay: true },
      );

      setAudioSound(sound);
      setIsPlayingAudio(true);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
          setAudioSound(null);
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert("Error", "Failed to play audio message");
    }
  };

  const handleVideoLoadStart = () => {
    setVideoLoading(true);
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const cardBg = isDarkMode ? "#1A1F2E" : "#FFFFFF";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#58CC02" />
        </View>
      </ThemedView>
    );
  }

  if (!capsule) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={textPrimary}
            />
          </TouchableOpacity>
          <ThemedText style={[styles.errorText, { color: textSecondary }]}>
            Capsule not found
          </ThemedText>
        </ScrollView>
      </ThemedView>
    );
  }

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
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const unlockDateOnly = new Date(
    unlocksDate.getFullYear(),
    unlocksDate.getMonth(),
    unlocksDate.getDate(),
  );
  const isUnlocked = capsule.is_unlocked || unlockDateOnly <= todayDate;
  const countdownText = formatCountdown(capsule.unlock_date);

  console.log("🔍 Capsule Debug Info:");
  console.log("unlock_date:", capsule.unlock_date);
  console.log("unlocked_at:", capsule.unlocked_at);
  console.log("is_unlocked:", capsule.is_unlocked);
  console.log("todayDate:", todayDate);
  console.log("unlockDateOnly:", unlockDateOnly);
  console.log("isUnlocked (calculated):", isUnlocked);

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={textPrimary}
          />
          <ThemedText style={[styles.backText, { color: textPrimary }]}>
            Back
          </ThemedText>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.typeIcon, { fontSize: 64 }]}>
            {typeIcons[capsule.message_type]}
          </ThemedText>
          <ThemedText style={[styles.title, { color: textPrimary }]}>
            {typeLabels[capsule.message_type]}
          </ThemedText>
        </View>

        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: isUnlocked ? "#58CC02" : "#1F9FFF",
              borderColor: isUnlocked ? "#58CC02" : "#1F9FFF",
            },
            Platform.OS === "ios" && {
              shadowColor: isUnlocked ? "#58CC02" : "#1F9FFF",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
            },
            Platform.OS === "android" && {
              elevation: 8,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isUnlocked ? "lock-open" : "lock-clock"}
            size={32}
            color="#FFFFFF"
            style={styles.statusIcon}
          />
          <View style={styles.statusContent}>
            <ThemedText style={[styles.statusTitle, { color: "#FFFFFF" }]}>
              {isUnlocked ? "Unlocked" : "Locked"}
            </ThemedText>
            <ThemedText
              style={[
                styles.statusSubtitle,
                { color: "rgba(255,255,255,0.8)" },
              ]}
            >
              {isUnlocked
                ? "This capsule is now available"
                : `Unlocks in ${countdownText}`}
            </ThemedText>
            <ThemedText
              style={[styles.statusDate, { color: "rgba(255,255,255,0.7)" }]}
            >
              {unlocksDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </ThemedText>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <ThemedText style={[styles.contentTitle, { color: textPrimary }]}>
            Your Message
          </ThemedText>

          {!isUnlocked ? (
            <View
              style={[
                styles.lockedContent,
                {
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="lock"
                size={48}
                color={textSecondary}
              />
              <ThemedText style={[styles.lockedText, { color: textSecondary }]}>
                This capsule is locked
              </ThemedText>
              <ThemedText
                style={[styles.lockedSubtext, { color: textSecondary }]}
              >
                Come back on{" "}
                {unlocksDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                to view the message
              </ThemedText>
            </View>
          ) : (
            <>
              {capsule.message_type === "text" && capsule.message_text && (
                <View
                  style={[
                    styles.textContent,
                    {
                      backgroundColor: cardBg,
                      borderColor: borderColor,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.textMessage, { color: textPrimary }]}
                  >
                    {capsule.message_text}
                  </ThemedText>
                </View>
              )}

              {capsule.message_type === "voice" && capsule.message_url && (
                <TouchableOpacity
                  onPress={playAudio}
                  style={[
                    styles.mediaContent,
                    {
                      backgroundColor: cardBg,
                      borderColor: borderColor,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isPlayingAudio ? "pause-circle" : "play-circle"}
                    size={48}
                    color="#58CC02"
                  />
                  <ThemedText
                    style={[styles.mediaLabel, { color: textSecondary }]}
                  >
                    {isPlayingAudio
                      ? "Playing..."
                      : "Tap to play voice message"}
                  </ThemedText>
                  <ThemedText
                    style={[styles.mediaUrl, { color: textSecondary }]}
                  >
                    {capsule.message_url.split("/").pop()}
                  </ThemedText>
                </TouchableOpacity>
              )}

              {capsule.message_type === "video" && capsule.message_url && (
                <View style={styles.videoSection}>
                  <View style={styles.videoWrapper}>
                    <Video
                      source={{ uri: capsule.message_url }}
                      style={styles.videoPlayer}
                      useNativeControls
                      isLooping={false}
                      progressUpdateIntervalMillis={500}
                      onLoadStart={handleVideoLoadStart}
                      onLoad={handleVideoLoad}
                      onPlaybackStatusUpdate={(status: any) => {
                        if (status.isBuffering) {
                          setVideoLoading(true);
                        } else if (status.isLoaded) {
                          setVideoLoading(false);
                        }
                      }}
                    />
                    {videoLoading && (
                      <View style={styles.videoLoadingOverlay}>
                        <ActivityIndicator size="large" color="#58CC02" />
                        <ThemedText
                          style={[styles.loadingText, { color: "#FFFFFF" }]}
                        >
                          Loading video...
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText
                    style={[styles.videoLabel, { color: textSecondary }]}
                  >
                    Video Message
                  </ThemedText>
                </View>
              )}

              {!capsule.message_text && !capsule.message_url && (
                <ThemedText
                  style={[styles.noContent, { color: textSecondary }]}
                >
                  No content available
                </ThemedText>
              )}
            </>
          )}
        </View>

        {/* Created Date */}
        <View style={styles.metaSection}>
          <ThemedText style={[styles.metaLabel, { color: textSecondary }]}>
            Unlock Date
          </ThemedText>
          <ThemedText style={[styles.metaValue, { color: textPrimary }]}>
            {unlocksDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
        </View>

        <View style={styles.metaSection}>
          <ThemedText style={[styles.metaLabel, { color: textSecondary }]}>
            Created on
          </ThemedText>
          <ThemedText style={[styles.metaValue, { color: textPrimary }]}>
            {new Date(capsule.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  typeIcon: {
    marginBottom: 12,
    lineHeight: 72,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    gap: 16,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 12,
  },
  contentSection: {
    marginBottom: 32,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  lockedContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  lockedSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  textContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  textMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  mediaContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  videoSection: {
    alignItems: "center",
    gap: 12,
  },
  videoWrapper: {
    width: "100%",
    position: "relative",
  },
  videoPlayer: {
    width: "100%",
    height: 400,
    backgroundColor: "#000000",
    borderRadius: 12,
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  mediaUrl: {
    fontSize: 12,
  },
  noContent: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  metaSection: {
    marginBottom: 24,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
});
