import { useAuth } from "@/app/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useTheme } from "@/context/ThemeContext";
import { useTimeCapsule } from "@/context/TimeCapsuleContext";
import { supabase } from "@/lib/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Circle, Svg } from "react-native-svg";
import OnboardingHeader from "../../widgets/OnboardingHeader";

const PRIMARY_GREEN = "#58CC02";
const WAVE_SKY_BLUE = "#38BDF8";
const LOCK_AMBER = "#F59E0B";
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

type MessageType = "video" | "voice" | "text" | null;
type UnlockTime = "6months" | "1year" | "3years" | "5years" | "custom" | null;

export default function TimeCapsuleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const {
    cameraPermission,
    audioPermission,
    requestCameraPermissionAsync,
    requestAudioPermissionAsync,
  } = usePermissions();
  const {
    unlockTime,
    setUnlockTime,
    customDate,
    setCustomDate,
    getUnlockDate,
    calculateCountdown,
  } = useTimeCapsule();
  const [messageType, setMessageType] = useState<MessageType>(null);
  const [textMessage, setTextMessage] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(
    null,
  );
  const [videoRecordingUri, setVideoRecordingUri] = useState<string | null>(
    null,
  );
  const [countdownTime, setCountdownTime] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCustomDate, setSelectedCustomDate] = useState<Date | null>(
    null,
  );
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [yearPickerPage, setYearPickerPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadAborted, setUploadAborted] = useState(false);
  const [timeCapsuleId, setTimeCapsuleId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [existingCapsules, setExistingCapsules] = useState<any[]>([]);
  const [loadingCapsules, setLoadingCapsules] = useState(false);
  const [showExistingCapsules, setShowExistingCapsules] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(true);
  const rotateAnim = new Animated.Value(0);
  const rippleAnim = new Animated.Value(0);
  const lockShakeAnim = new Animated.Value(0);
  const waveAnim = new Animated.Value(0);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  // Handle video URI from camera
  useEffect(() => {
    if (params.videoUri) {
      setVideoRecordingUri(params.videoUri as string);
      if (params.videoDuration) {
        const durationMs = parseInt(params.videoDuration as string);
        const seconds = Math.floor(durationMs / 1000);
        setRecordingDuration(seconds);
      }
      // Auto-select video message type
      setMessageType("video");
    }
  }, [params.videoUri, params.videoDuration]);

  // Update recording duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Countdown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCountingDown && countdownTime > 0) {
      interval = setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            setIsCountingDown(false);
            setCountdownComplete(true);
            // Trigger lock closing animation sequence
            Animated.sequence([
              // Lock shake/close animation
              Animated.timing(lockShakeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: false,
              }),
              // Lock spin
              Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
              }),
              // Ripple effect
              Animated.timing(rippleAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false,
              }),
            ]).start();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCountingDown]);

  // Wave animation loop
  useEffect(() => {
    if (countdownComplete) {
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      );
      waveAnimation.start();

      return () => {
        waveAnimation.stop();
      };
    }
  }, [countdownComplete, waveAnim]);

  // Fetch existing time capsules on mount
  useEffect(() => {
    if (!initialLoadComplete) {
      fetchExistingCapsules();
    }
  }, [user?.id, initialLoadComplete]);

  const fetchExistingCapsules = async () => {
    try {
      if (!user?.id) return;

      setLoadingCapsules(true);
      console.log("📝 Fetching existing time capsules for user:", user.id);
      const startTime = Date.now();

      const { data, error } = await (supabase.from("time_capsules") as any)
        .select("id, message_type, unlock_date, is_unlocked")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const endTime = Date.now();
      console.log(`⏱️ Time capsules fetch took ${endTime - startTime}ms`);

      if (error) {
        console.error("Error fetching time capsules:", error);
      } else if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} existing time capsule(s)`);
        setExistingCapsules(data);
        setShowExistingCapsules(true);
      } else {
        console.log("ℹ️ No existing time capsules found");
        setShowExistingCapsules(false);
      }
    } catch (err) {
      console.error("Error in fetchExistingCapsules:", err);
    } finally {
      setLoadingCapsules(false);
      setInitialLoadComplete(true);
    }
  };

  const deleteTimeCapsule = async (capsuleId: string) => {
    try {
      Alert.alert(
        "Delete Time Capsule",
        "Are you sure you want to delete this time capsule?",
        [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          {
            text: "Delete",
            onPress: async () => {
              const { error } = await (supabase.from("time_capsules") as any)
                .delete()
                .eq("id", capsuleId);

              if (error) {
                Alert.alert("Error", "Failed to delete time capsule");
                console.error("Delete error:", error);
              } else {
                console.log("✅ Time capsule deleted");
                // Refresh the list
                setExistingCapsules(
                  existingCapsules.filter((c) => c.id !== capsuleId),
                );
                if (existingCapsules.length <= 1) {
                  setShowExistingCapsules(false);
                }
              }
            },
            style: "destructive",
          },
        ],
      );
    } catch (error) {
      console.error("Error deleting capsule:", error);
    }
  };

  const startVoiceRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording");
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setVoiceRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
      alert("Failed to stop recording");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMessageTypeSelect = async (type: MessageType) => {
    if (type === "voice") {
      const audioGranted = await requestAudioPermissionAsync();
      if (!audioGranted) {
        alert("Microphone permission is required to record audio.");
        return;
      }
    } else if (type === "video") {
      const cameraGranted = await requestCameraPermissionAsync();
      if (!cameraGranted) {
        alert("Camera permission is required to record video.");
        return;
      }
    }
    setMessageType(type);
  };

  const handleOpenCamera = async () => {
    if (!cameraPermission) {
      const granted = await requestCameraPermissionAsync();
      if (!granted) {
        Alert.alert(
          "Error",
          "Camera permission is required to record video. Please enable it in settings.",
        );
        return;
      }
    }

    try {
      // Launch native camera directly
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        console.log("Video recorded via native camera:", video.uri);

        // Navigate to preview screen
        router.push({
          pathname: "/screens/camera-preview",
          params: {
            uri: video.uri,
            type: "video",
            mode: "timecapsule",
          },
        });
      } else {
        console.log("User cancelled video recording");
      }
    } catch (error: any) {
      console.error("ERROR in native camera:", error);
      Alert.alert("Error", "Failed to record video: " + error.message);
    }
  };

  const handleVoiceRecording = async () => {
    if (!audioPermission) {
      const granted = await requestAudioPermissionAsync();
      if (!granted) {
        alert(
          "Microphone permission is required to record audio. Please enable it in settings.",
        );
        return;
      }
    }
    startVoiceRecording();
  };

  const handleVideoRecorded = (uri: string) => {
    setVideoRecordingUri(uri);
  };

  const handleSealCapsule = () => {
    if (!messageType) {
      alert("Please select a message type");
      return;
    }
    if (!unlockTime) {
      alert("Please select an unlock time");
      return;
    }
    if (messageType === "text" && textMessage.trim().length === 0) {
      alert("Please write a message");
      return;
    }
    if (messageType === "voice" && !voiceRecordingUri) {
      alert("Please record a voice message");
      return;
    }
    if (messageType === "video" && !videoRecordingUri) {
      alert("Please record a video message");
      return;
    }

    // Start upload immediately
    saveTimeCapsule();

    // Start countdown for UI animation
    setCountdownTime(3);
    setIsCountingDown(true);
    setCountdownComplete(false);
  };

  const handleContinue = async () => {
    router.replace("/screens/home");
  };

  const handleCancelCountdown = async () => {
    setUploadAborted(true);
    setIsCountingDown(false);
    setCountdownTime(3);

    // If time capsule was saved, delete it
    if (timeCapsuleId && uploadedFileName && user?.id) {
      try {
        console.log("Cancelling time capsule, cleaning up...");

        // Delete from database
        const { error: dbError } = await (supabase.from("time_capsules") as any)
          .delete()
          .eq("id", timeCapsuleId);

        if (dbError) {
          console.error("Error deleting time capsule from database:", dbError);
        } else {
          console.log("Time capsule deleted from database");
        }

        // Delete file from storage using REST API
        if (messageType !== "text") {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
              const filePath = `${user.id}/${uploadedFileName}`;
              const deleteUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/time-capsules/${filePath}`;

              const deleteResponse = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (deleteResponse.ok) {
                console.log("File deleted from storage successfully");
              } else {
                const errorText = await deleteResponse.text();
                console.error(
                  "Error deleting file from storage:",
                  deleteResponse.status,
                  errorText,
                );
              }
            }
          } catch (error) {
            console.error("Error deleting file from storage:", error);
          }
        }

        // Reset state
        setTimeCapsuleId(null);
        setUploadedFileName(null);
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }
  };

  const saveTimeCapsule = async () => {
    try {
      setIsSaving(true);
      setUploadAborted(false);

      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }

      let messageUrl: string | null = null;
      let uploadSuccess = false;
      let fileName: string | null = null;

      // Upload file to Supabase Storage if it's video or voice
      if (messageType === "video" && videoRecordingUri) {
        try {
          fileName = `video-${Date.now()}.mp4`;

          console.log("Starting video upload:", fileName);

          const response = await fetch(videoRecordingUri);
          const blob = await response.blob();

          // Use REST API directly for more reliable upload
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            console.warn("No auth token available");
          } else {
            const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/time-capsules/${user.id}/${fileName}`;

            const uploadResponse = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "video/mp4",
              },
              body: blob,
            });

            if (uploadResponse.ok) {
              messageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/time-capsules/${user.id}/${fileName}`;
              uploadSuccess = true;
              console.log("Video uploaded successfully");
            } else {
              console.warn(
                "Video upload failed:",
                uploadResponse.status,
                uploadResponse.statusText,
              );
            }
          }
        } catch (error) {
          console.warn("Video upload error:", error);
        }
      } else if (messageType === "voice" && voiceRecordingUri) {
        try {
          fileName = `voice-${Date.now()}.m4a`;

          console.log("Starting audio upload:", fileName);

          const response = await fetch(voiceRecordingUri);
          const blob = await response.blob();

          // Use REST API directly for more reliable upload
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            console.warn("No auth token available");
          } else {
            const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/time-capsules/${user.id}/${fileName}`;

            const uploadResponse = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "audio/m4a",
              },
              body: blob,
            });

            if (uploadResponse.ok) {
              messageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/time-capsules/${user.id}/${fileName}`;
              uploadSuccess = true;
              console.log("Audio uploaded successfully");
            } else {
              console.warn(
                "Audio upload failed:",
                uploadResponse.status,
                uploadResponse.statusText,
              );
            }
          }
        } catch (error) {
          console.warn("Audio upload error:", error);
        }
      }

      // Calculate unlock date
      const unlockDateObj = new Date();
      if (unlockTime === "6months") {
        unlockDateObj.setMonth(unlockDateObj.getMonth() + 6);
      } else if (unlockTime === "1year") {
        unlockDateObj.setFullYear(unlockDateObj.getFullYear() + 1);
      } else if (unlockTime === "3years") {
        unlockDateObj.setFullYear(unlockDateObj.getFullYear() + 3);
      } else if (unlockTime === "5years") {
        unlockDateObj.setFullYear(unlockDateObj.getFullYear() + 5);
      } else if (unlockTime === "custom" && selectedCustomDate) {
        unlockDateObj.setTime(selectedCustomDate.getTime());
      }

      // Save to database (with or without file URL)
      const { data, error } = await (supabase.from("time_capsules") as any)
        .insert({
          user_id: user.id,
          message_type: messageType,
          message_url: messageUrl,
          message_text: messageType === "text" ? textMessage : null,
          unlock_date: unlockDateObj.toISOString().split("T")[0], // Save as DATE format (YYYY-MM-DD)
          unlocked_at: null, // Will be set when capsule is actually unlocked
          is_unlocked: false,
        })
        .select();

      if (error) {
        console.error("Error saving time capsule to database:", error);
      } else {
        // Store the ID and filename for potential cleanup if user cancels
        if (data && data.length > 0) {
          setTimeCapsuleId(data[0].id);
          setUploadedFileName(fileName);
        }

        if (uploadSuccess) {
          console.log("Time capsule saved successfully with file");
        } else if (messageType === "text") {
          console.log("Text time capsule saved successfully");
        } else {
          console.log(
            "Time capsule saved. File upload will retry in background",
          );
        }
      }
    } catch (error) {
      console.error("Error in saveTimeCapsule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <OnboardingHeader
          currentStep={4}
          totalSteps={5}
          onBack={() => router.push("/screens/onboarding/avatar-creation")}
        />

        {/* Show existing capsules if any */}
        {showExistingCapsules && !isCountingDown && !countdownComplete && (
          <View
            style={[
              styles.existingCapsulesCard,
              { backgroundColor: isDarkMode ? "#1A3A2A" : "#E8F5E9" },
            ]}
          >
            <Text
              style={[styles.existingCapsulesTitle, { color: PRIMARY_GREEN }]}
            >
              📦 You have {existingCapsules.length} time capsule
              {existingCapsules.length !== 1 ? "s" : ""}
            </Text>
            <Text
              style={[
                styles.existingCapsulesSubtitle,
                { color: subtitleColor },
              ]}
            >
              You can delete any or continue without creating a new one
            </Text>

            {existingCapsules.map((capsule, index) => (
              <View
                key={capsule.id}
                style={[styles.capsuleListItem, { borderColor: borderColor }]}
              >
                <View style={styles.capsuleListContent}>
                  <Text style={[styles.capsuleListType, { color: textColor }]}>
                    {capsule.message_type === "video"
                      ? "🎥"
                      : capsule.message_type === "voice"
                        ? "🎤"
                        : "📝"}{" "}
                    {capsule.message_type.charAt(0).toUpperCase() +
                      capsule.message_type.slice(1)}
                  </Text>
                  <Text
                    style={[styles.capsuleListDate, { color: subtitleColor }]}
                  >
                    Unlocks:{" "}
                    {new Date(capsule.unlock_date).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTimeCapsule(capsule.id)}
                >
                  <MaterialCommunityIcons
                    name="trash-can"
                    size={20}
                    color="#FF6B6B"
                  />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.continueWithoutNewButton,
                { borderColor: PRIMARY_GREEN },
              ]}
              onPress={() => router.push("/screens/home")}
            >
              <Text
                style={[
                  styles.continueWithoutNewButtonText,
                  { color: PRIMARY_GREEN },
                ]}
              >
                Continue Without Creating New
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isCountingDown || countdownComplete ? (
          <>
            {/* Countdown Animation Screen */}
            <View style={styles.countdownContainer}>
              <Text style={[styles.title, { color: textColor }]}>
                {countdownComplete
                  ? "Your Time Capsule is Sealed! 🔒"
                  : "Sealing Your Time Capsule..."}
              </Text>

              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {countdownComplete
                  ? "Your message is safely locked away"
                  : "Your message will be locked away safely"}
              </Text>

              {/* Lock icon with rotation animation */}
              <View style={styles.lockContainer}>
                {/* Wave animations - only show after countdown completes */}
                {countdownComplete && (
                  <>
                    <Animated.View
                      style={[
                        styles.wave,
                        {
                          opacity: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 0],
                          }),
                          transform: [
                            {
                              scale: waveAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 2.5],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.wave,
                        {
                          opacity: waveAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 0.5, 0],
                          }),
                          transform: [
                            {
                              scale: waveAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1.3, 3],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </>
                )}

                <Animated.View
                  style={[
                    styles.lockIconWrapper,
                    {
                      transform: [
                        {
                          rotateY: rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                        {
                          rotateZ: lockShakeAnim.interpolate({
                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                            outputRange: [
                              "0deg",
                              "-15deg",
                              "15deg",
                              "-15deg",
                              "0deg",
                            ],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={countdownComplete ? "lock" : "lock-open"}
                    size={80}
                    color={LOCK_AMBER}
                  />
                </Animated.View>

                {/* Circular progress indicator */}
                <Svg width={200} height={200} style={styles.progressCircle}>
                  <Circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke={WAVE_SKY_BLUE}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(565 * (3 - countdownTime)) / 3} 565`}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>

              {/* Ripple effect - only show after countdown completes */}
              {countdownComplete && (
                <Animated.View
                  style={[
                    styles.ripple,
                    {
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 0],
                      }),
                      transform: [
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Countdown text */}
              <Text style={[styles.countdownText, { color: WAVE_SKY_BLUE }]}>
                {countdownTime > 0 ? countdownTime : ""}
              </Text>

              {/* Message locked info - only show after countdown completes */}
              {countdownComplete && (
                <View style={styles.lockedInfoContainer}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color={WAVE_SKY_BLUE}
                  />
                  <Text
                    style={[styles.lockedInfoText, { color: subtitleColor }]}
                  >
                    Your message is locked until
                  </Text>
                  <Text
                    style={[styles.lockedDateText, { color: WAVE_SKY_BLUE }]}
                  >
                    {getUnlockDate(unlockTime, selectedCustomDate)}
                  </Text>
                  <Text
                    style={[styles.countdownInfoText, { color: subtitleColor }]}
                  >
                    {calculateCountdown(unlockTime, selectedCustomDate)}
                  </Text>
                </View>
              )}

              {/* Action buttons - only visible during countdown */}
              {!countdownComplete && (
                <View style={styles.countdownActionButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.countdownActionButton,
                      { backgroundColor: PRIMARY_GREEN },
                    ]}
                    onPress={handleCancelCountdown}
                  >
                    <Text style={styles.countdownActionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Buttons after countdown - Continue and Create Another */}
              {countdownComplete && (
                <View style={styles.countdownActionButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.countdownActionButton,
                      { backgroundColor: PRIMARY_GREEN },
                    ]}
                    onPress={() =>
                      router.replace("/screens/home")
                    }
                  >
                    <Text style={styles.countdownActionButtonText}>
                      Continue
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.countdownActionButton,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 2,
                        borderColor: PRIMARY_GREEN,
                      },
                    ]}
                    onPress={() => {
                      setCountdownTime(3);
                      setCountdownComplete(false);
                      setIsCountingDown(false);
                      setMessageType(null);
                      setTextMessage("");
                      setUnlockTime(null);
                      setVoiceRecordingUri(null);
                      setVideoRecordingUri(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.countdownActionButtonText,
                        { color: PRIMARY_GREEN },
                      ]}
                    >
                      Create Another
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Original Selection Screen */}
            {/* Title */}
            <Text style={[styles.title, { color: textColor }]}>
              Leave a time capsule for a better version of yourself
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              In your future, when you become your Better Self, what would your
              current self want to say?
            </Text>

            <Text style={[styles.description, { color: subtitleColor }]}>
              Leave a message—video, voice, or text—that will be sealed until
              that day. It's a gift from who you are now to who you'll become.
            </Text>

            {/* Message Type Selection */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Choose Your Message Type
            </Text>

            <TouchableOpacity
              style={[
                styles.messageTypeCard,
                {
                  backgroundColor: inputBg,
                  borderColor:
                    messageType === "video" ? PRIMARY_GREEN : borderColor,
                  borderWidth: messageType === "video" ? 2 : 1,
                },
              ]}
              onPress={() => handleMessageTypeSelect("video")}
            >
              <MaterialCommunityIcons
                name="video"
                size={24}
                color={PRIMARY_GREEN}
              />
              <View style={styles.messageTypeContent}>
                <Text style={[styles.messageTypeTitle, { color: textColor }]}>
                  Record Video
                </Text>
                <Text
                  style={[styles.messageTypeSubtitle, { color: subtitleColor }]}
                >
                  Share your vision in motion
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.messageTypeCard,
                {
                  backgroundColor: inputBg,
                  borderColor:
                    messageType === "voice" ? PRIMARY_GREEN : borderColor,
                  borderWidth: messageType === "voice" ? 2 : 1,
                },
              ]}
              onPress={() => handleMessageTypeSelect("voice")}
            >
              <MaterialCommunityIcons
                name="microphone"
                size={24}
                color={PRIMARY_GREEN}
              />
              <View style={styles.messageTypeContent}>
                <Text style={[styles.messageTypeTitle, { color: textColor }]}>
                  Record Voice
                </Text>
                <Text
                  style={[styles.messageTypeSubtitle, { color: subtitleColor }]}
                >
                  Speak from the heart
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.messageTypeCard,
                {
                  backgroundColor: inputBg,
                  borderColor:
                    messageType === "text" ? PRIMARY_GREEN : borderColor,
                  borderWidth: messageType === "text" ? 2 : 1,
                },
              ]}
              onPress={() => handleMessageTypeSelect("text")}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={24}
                color={PRIMARY_GREEN}
              />
              <View style={styles.messageTypeContent}>
                <Text style={[styles.messageTypeTitle, { color: textColor }]}>
                  Write Text
                </Text>
                <Text
                  style={[styles.messageTypeSubtitle, { color: subtitleColor }]}
                >
                  Put your thoughts into words
                </Text>
              </View>
            </TouchableOpacity>

            {/* Text Input - Only show if text is selected */}
            {messageType === "text" && (
              <View style={styles.textInputSection}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: inputBg,
                      color: textColor,
                      borderColor: PRIMARY_GREEN,
                    },
                  ]}
                  placeholder="Write your message to your future self..."
                  placeholderTextColor={subtitleColor}
                  value={textMessage}
                  onChangeText={setTextMessage}
                  multiline
                  numberOfLines={6}
                />
                <Text style={[styles.characterCount, { color: subtitleColor }]}>
                  {textMessage.length} characters
                </Text>
              </View>
            )}

            {/* Voice Recording - Only show if voice is selected */}
            {messageType === "voice" && (
              <View style={styles.voiceRecordingSection}>
                {!voiceRecordingUri ? (
                  <>
                    <View
                      style={[
                        styles.recordingContainer,
                        { borderColor: PRIMARY_GREEN },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isRecording ? "microphone" : "microphone-outline"}
                        size={48}
                        color={isRecording ? "#FF4444" : PRIMARY_GREEN}
                      />
                      {isRecording && (
                        <Text
                          style={[
                            styles.recordingDuration,
                            { color: "#FF4444" },
                          ]}
                        >
                          {formatDuration(recordingDuration)}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.recordingStatus,
                          { color: subtitleColor },
                        ]}
                      >
                        {isRecording ? "Recording..." : "Ready to record"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.recordButton,
                        {
                          backgroundColor: isRecording
                            ? "#FF4444"
                            : PRIMARY_GREEN,
                        },
                      ]}
                      onPress={
                        isRecording ? stopVoiceRecording : handleVoiceRecording
                      }
                    >
                      <MaterialCommunityIcons
                        name={isRecording ? "stop" : "record"}
                        size={24}
                        color="#fff"
                      />
                      <Text style={styles.recordButtonText}>
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.recordingContainer,
                        { borderColor: PRIMARY_GREEN },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={48}
                        color={PRIMARY_GREEN}
                      />
                      <Text
                        style={[
                          styles.recordingStatus,
                          { color: PRIMARY_GREEN },
                        ]}
                      >
                        Recording saved ({formatDuration(recordingDuration)})
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.recordButton,
                        { backgroundColor: PRIMARY_GREEN },
                      ]}
                      onPress={() => {
                        setVoiceRecordingUri(null);
                        setRecordingDuration(0);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="microphone"
                        size={24}
                        color="#fff"
                      />
                      <Text style={styles.recordButtonText}>Re-record</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Video Recording - Only show if video is selected */}
            {messageType === "video" && (
              <View style={styles.voiceRecordingSection}>
                {!videoRecordingUri ? (
                  <>
                    <View
                      style={[
                        styles.recordingContainer,
                        { borderColor: PRIMARY_GREEN },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="video-outline"
                        size={48}
                        color={PRIMARY_GREEN}
                      />
                      <Text
                        style={[
                          styles.recordingStatus,
                          { color: subtitleColor },
                        ]}
                      >
                        Ready to record video
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.recordButton,
                        { backgroundColor: PRIMARY_GREEN },
                      ]}
                      onPress={handleOpenCamera}
                    >
                      <MaterialCommunityIcons
                        name="camera"
                        size={24}
                        color="#fff"
                      />
                      <Text style={styles.recordButtonText}>Open Camera</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.recordingContainer,
                        { borderColor: PRIMARY_GREEN },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={48}
                        color={PRIMARY_GREEN}
                      />
                      <Text
                        style={[
                          styles.recordingStatus,
                          { color: PRIMARY_GREEN },
                        ]}
                      >
                        Video recorded
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.recordButton,
                        { backgroundColor: PRIMARY_GREEN },
                      ]}
                      onPress={() => {
                        setVideoRecordingUri(null);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="camera"
                        size={24}
                        color="#fff"
                      />
                      <Text style={styles.recordButtonText}>Re-record</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Unlock Time Selection */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              When should it unlock?
            </Text>

            {(["6months", "1year", "3years", "5years"] as UnlockTime[]).map(
              (time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.unlockCard,
                    {
                      backgroundColor: inputBg,
                      borderColor:
                        unlockTime === time ? PRIMARY_GREEN : borderColor,
                      borderWidth: unlockTime === time ? 2 : 1,
                    },
                  ]}
                  onPress={() => setUnlockTime(time)}
                >
                  <View style={styles.unlockContent}>
                    <Text
                      style={[
                        styles.unlockTitle,
                        {
                          color:
                            unlockTime === time ? PRIMARY_GREEN : textColor,
                        },
                      ]}
                    >
                      {time === "6months" && "6 months"}
                      {time === "1year" && "1 year"}
                      {time === "3years" && "3 years"}
                      {time === "5years" && "5 years"}
                    </Text>
                    <Text style={[styles.unlockDate, { color: subtitleColor }]}>
                      Unlocks: {getUnlockDate(time)}
                    </Text>
                  </View>
                  {unlockTime === time && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color={PRIMARY_GREEN}
                    />
                  )}
                </TouchableOpacity>
              ),
            )}

            {/* Custom Date Card */}
            <TouchableOpacity
              style={[
                styles.unlockCard,
                {
                  backgroundColor: inputBg,
                  borderColor:
                    unlockTime === "custom" ? PRIMARY_GREEN : borderColor,
                  borderWidth: unlockTime === "custom" ? 2 : 1,
                },
              ]}
              onPress={() => setShowCalendar(true)}
            >
              <View style={styles.unlockContent}>
                <Text
                  style={[
                    styles.unlockTitle,
                    {
                      color:
                        unlockTime === "custom" ? PRIMARY_GREEN : textColor,
                    },
                  ]}
                >
                  Custom Date
                </Text>
                <Text style={[styles.unlockDate, { color: subtitleColor }]}>
                  {selectedCustomDate
                    ? selectedCustomDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Select a date"}
                </Text>
              </View>
              <View style={styles.unlockIconContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={selectedCustomDate ? textColor : subtitleColor}
                />
                {unlockTime === "custom" && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={PRIMARY_GREEN}
                    style={styles.checkIcon}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Calendar Modal */}
            {showCalendar && (
              <View
                style={[
                  styles.calendarModal,
                  { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                ]}
              >
                <View
                  style={[
                    styles.calendarContent,
                    { backgroundColor: bgColor, borderColor: borderColor },
                  ]}
                >
                  <View style={styles.calendarHeader}>
                    <Text style={[styles.calendarTitle, { color: textColor }]}>
                      Select Date
                    </Text>
                    <TouchableOpacity onPress={() => setShowCalendar(false)}>
                      <MaterialCommunityIcons
                        name="close"
                        size={20}
                        color={textColor}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Month/Year Selection */}
                  <View style={styles.monthYearNav}>
                    <TouchableOpacity
                      style={[
                        styles.monthYearButton,
                        { borderColor: borderColor },
                      ]}
                      onPress={() => {
                        setShowMonthPicker(!showMonthPicker);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthYearButtonText,
                          { color: textColor },
                        ]}
                      >
                        {calendarMonth.toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.monthYearButton,
                        { borderColor: borderColor },
                      ]}
                      onPress={() => {
                        setShowYearPicker(!showYearPicker);
                        setShowMonthPicker(false);
                        setYearPickerPage(0);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthYearButtonText,
                          { color: textColor },
                        ]}
                      >
                        {calendarMonth.getFullYear()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Year Picker */}
                  {showYearPicker && (
                    <View
                      style={[
                        styles.pickerContainer,
                        { backgroundColor: inputBg, borderColor: borderColor },
                      ]}
                    >
                      <View style={styles.monthGrid}>
                        {Array.from({ length: 12 }).map((_, i) => {
                          const year =
                            new Date().getFullYear() + yearPickerPage * 12 + i;
                          return (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.monthItem,
                                year === calendarMonth.getFullYear() && {
                                  backgroundColor: PRIMARY_GREEN,
                                },
                              ]}
                              onPress={() => {
                                setCalendarMonth(
                                  new Date(year, calendarMonth.getMonth()),
                                );
                                setShowYearPicker(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.monthItemText,
                                  {
                                    color:
                                      year === calendarMonth.getFullYear()
                                        ? "#fff"
                                        : textColor,
                                  },
                                ]}
                              >
                                {year}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.yearPickerNavigation}>
                        <TouchableOpacity
                          style={[
                            styles.yearNavButton,
                            yearPickerPage === 0 && { opacity: 0.5 },
                          ]}
                          onPress={() =>
                            setYearPickerPage(Math.max(0, yearPickerPage - 1))
                          }
                          disabled={yearPickerPage === 0}
                        >
                          <MaterialCommunityIcons
                            name="chevron-left"
                            size={20}
                            color={PRIMARY_GREEN}
                          />
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.yearPageIndicator,
                            { color: textColor },
                          ]}
                        >
                          {new Date().getFullYear() + yearPickerPage * 12} -{" "}
                          {new Date().getFullYear() + yearPickerPage * 12 + 11}
                        </Text>
                        <TouchableOpacity
                          style={styles.yearNavButton}
                          onPress={() => setYearPickerPage(yearPickerPage + 1)}
                        >
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={PRIMARY_GREEN}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Month Picker */}
                  {showMonthPicker && (
                    <View
                      style={[
                        styles.pickerContainer,
                        { backgroundColor: inputBg, borderColor: borderColor },
                      ]}
                    >
                      <View style={styles.monthGrid}>
                        {[
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ].map((month, idx) => (
                          <TouchableOpacity
                            key={month}
                            style={[
                              styles.monthItem,
                              idx === calendarMonth.getMonth() && {
                                backgroundColor: PRIMARY_GREEN,
                              },
                            ]}
                            onPress={() => {
                              setCalendarMonth(
                                new Date(calendarMonth.getFullYear(), idx),
                              );
                              setShowMonthPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.monthItemText,
                                {
                                  color:
                                    idx === calendarMonth.getMonth()
                                      ? "#fff"
                                      : textColor,
                                },
                              ]}
                            >
                              {month}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Calendar Grid */}
                  {!showYearPicker && !showMonthPicker && (
                    <>
                      <View style={styles.dayHeaders}>
                        {["S", "M", "T", "W", "T", "F", "S"].map(
                          (day, index) => (
                            <Text
                              key={index}
                              style={[
                                styles.dayHeader,
                                { color: subtitleColor },
                              ]}
                            >
                              {day}
                            </Text>
                          ),
                        )}
                      </View>

                      <View style={styles.calendarGrid}>
                        {Array.from({ length: 42 }).map((_, index) => {
                          const firstDay = new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth(),
                            1,
                          ).getDay();
                          const daysInMonth = new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth() + 1,
                            0,
                          ).getDate();
                          const dayNumber = index - firstDay + 1;
                          const isCurrentMonth =
                            dayNumber > 0 && dayNumber <= daysInMonth;
                          const date = isCurrentMonth
                            ? new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth(),
                                dayNumber,
                              )
                            : null;
                          const isSelected =
                            selectedCustomDate &&
                            date &&
                            date.toDateString() ===
                              selectedCustomDate.toDateString();
                          const isPast = date && date < new Date();

                          return (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.calendarDay,
                                isSelected && {
                                  backgroundColor: PRIMARY_GREEN,
                                },
                                isPast && !isSelected && { opacity: 0.4 },
                              ]}
                              onPress={() => {
                                if (isCurrentMonth && date && !isPast) {
                                  setSelectedCustomDate(date);
                                  setCustomDate(date);
                                  setUnlockTime("custom");
                                }
                              }}
                              disabled={
                                !isCurrentMonth || (isPast ? true : false)
                              }
                            >
                              <Text
                                style={[
                                  styles.calendarDayText,
                                  {
                                    color: isCurrentMonth
                                      ? textColor
                                      : "transparent",
                                  },
                                  isSelected && {
                                    color: "#fff",
                                    fontWeight: "bold",
                                  },
                                ]}
                              >
                                {isCurrentMonth ? dayNumber : ""}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.calendarConfirmButton,
                      { backgroundColor: PRIMARY_GREEN },
                    ]}
                    onPress={() => setShowCalendar(false)}
                  >
                    <Text style={styles.calendarConfirmButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Seal Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.sealButton, { backgroundColor: PRIMARY_GREEN }]}
                onPress={handleSealCapsule}
                activeOpacity={0.7}
              >
                <Text style={styles.sealButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.disclaimer, { color: subtitleColor }]}>
              You can edit this before sealing
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 24,
  },
  messageTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  messageTypeContent: {
    flex: 1,
  },
  messageTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageTypeSubtitle: {
    fontSize: 13,
  },
  textInputSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: "right",
  },
  voiceRecordingSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  recordingContainer: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  recordingDuration: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
  },
  recordingStatus: {
    fontSize: 14,
    marginTop: 8,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  unlockCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  unlockContent: {
    flex: 1,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  unlockDate: {
    fontSize: 13,
  },
  unlockIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    marginLeft: 4,
  },
  buttonContainer: {
    position: "relative",
    marginTop: 30,
    marginBottom: 12,
  },
  sealButton: {
    width: "100%",
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  sealButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
  },
  sealedContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  lockCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  sealedTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  sealedDate: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  countdownBox: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    width: "100%",
  },
  countdownBoxText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  capsuleTypeInfo: {
    marginBottom: 24,
    width: "100%",
  },
  capsuleTypeLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  capsuleTypeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  editButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "relative",
    paddingTop: 20,
  },
  continueButton: {
    width: "100%",
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  countdownContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  lockContainer: {
    position: "relative",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  lockIconWrapper: {
    position: "absolute",
    zIndex: 2,
  },
  progressCircle: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
  countdownText: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 20,
  },
  ripple: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: WAVE_SKY_BLUE,
  },
  wave: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: WAVE_SKY_BLUE,
  },
  countdownActionButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  countdownActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  countdownActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  lockedInfoContainer: {
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  lockedInfoText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  lockedDateText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  countdownInfoText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  calendarModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  calendarContent: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    width: "100%",
    maxWidth: 320,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  monthYearNav: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  monthYearButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  monthYearButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    maxHeight: 150,
  },
  pickerScroll: {
    maxHeight: 150,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  monthItem: {
    width: "33.33%",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  monthItemText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginVertical: 4,
  },
  calendarDayActive: {
    opacity: 1,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 12,
  },
  calendarConfirmButton: {
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarConfirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  yearPickerNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  yearNavButton: {
    padding: 8,
  },
  yearPageIndicator: {
    fontSize: 12,
    fontWeight: "600",
  },
  existingCapsulesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  existingCapsulesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  existingCapsulesSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  capsuleListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  capsuleListContent: {
    flex: 1,
  },
  capsuleListType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  capsuleListDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  continueWithoutNewButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  continueWithoutNewButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
