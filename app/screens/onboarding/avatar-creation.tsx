import { useAuth } from "@/app/context/AuthContext";
import { useOnboardingAvatar } from "@/context/OnboardingAvatarContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Animated,
    Image,
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
const DARK_CARD_BG = "#1A2332";
const LIGHT_CARD_BG = "#FFFFFF";
const DARK_BORDER = "#2A3A4A";
const LIGHT_BORDER = "#E0E0E0";

export default function AvatarCreationScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { setAvatarUri: setContextAvatarUri } = useOnboardingAvatar();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null,
  );
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [showExistingAvatar, setShowExistingAvatar] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);
  const [avatarType, setAvatarType] = useState<"profile" | "betterSelf">(
    "profile",
  );
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(
    null,
  );
  const [showGeneratedAvatar, setShowGeneratedAvatar] = useState(false);
  const [aspirationSummary, setAspirationSummary] = useState<string>("");

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  // Fetch existing avatar on mount
  React.useEffect(() => {
    if (!initialLoadComplete) {
      fetchExistingAvatar();
    }
  }, [user?.id, initialLoadComplete]);

  const fetchExistingAvatar = async () => {
    try {
      if (!user?.id) return;

      setLoadingAvatar(true);
      console.log("📝 Fetching existing avatars for user:", user.id);
      const startTime = Date.now();

      const { data, error } = await (supabase.from("users") as any)
        .select("avatar_url, better_self_avatar_url")
        .eq("id", user.id)
        .single();

      const endTime = Date.now();
      console.log(`⏱️ Avatar fetch took ${endTime - startTime}ms`);

      if (error) {
        console.error("Error fetching avatars:", error);
      } else {
        // Determine which avatar to show
        if (!data?.avatar_url) {
          console.log("ℹ️ No profile avatar found, creating profile avatar");
          setAvatarType("profile");
          setShowExistingAvatar(false);
        } else if (!data?.better_self_avatar_url) {
          console.log("ℹ️ Profile avatar exists, creating better self avatar");
          setAvatarType("betterSelf");
          setExistingAvatarUrl(data.avatar_url);
          setShowExistingAvatar(true);
        } else {
          console.log("✅ Both avatars exist");
          setAvatarType("betterSelf");
          setExistingAvatarUrl(data.better_self_avatar_url);
          setShowExistingAvatar(true);
        }
      }
    } catch (err) {
      console.error("Error in fetchExistingAvatar:", err);
    } finally {
      setLoadingAvatar(false);
      setInitialLoadComplete(true);
    }
  };

  const fetchAspirationSummary = async () => {
    try {
      if (!user?.id) return;
      const { data } = await (supabase.from("aspirations") as any)
        .select("description")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (data?.description) {
        setAspirationSummary(data.description);
      }
    } catch (err) {
      console.error("Error fetching aspiration summary:", err);
    }
  };

  const handleContinue = async () => {
    if (!avatarUri) {
      Alert.alert(
        "Avatar Required",
        "Please take a selfie to create your avatar",
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsUploading(true);

    try {
      // For profile avatar: Upload the photo directly
      if (avatarType === "profile") {
        const fileName = `avatar-profile-${Date.now()}.jpg`;
        console.log("📸 Uploading profile avatar:", fileName);

        const response = await fetch(avatarUri);
        const blob = await response.blob();

        // Get auth token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          Alert.alert("Error", "Authentication failed");
          setIsUploading(false);
          return;
        }

        // Upload to storage
        const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/avatars/${user.id}/${fileName}`;

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "image/jpeg",
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          console.error("Upload failed:", uploadResponse.status);
          Alert.alert("Error", "Failed to upload avatar");
          setIsUploading(false);
          return;
        }

        // Get public URL
        const avatarUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/${fileName}`;
        console.log("✅ Profile avatar uploaded:", avatarUrl);

        // Update user profile with profile avatar URL
        const { error: updateError } = await (supabase.from("users") as any)
          .update({ avatar_url: avatarUrl })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating user profile:", updateError);
          Alert.alert("Error", "Failed to save avatar");
          setIsUploading(false);
          return;
        }

        console.log("✅ User profile updated with profile avatar URL");
        setContextAvatarUri(avatarUri);

        // Check if we need to create better self avatar
        const { data: userData, error: fetchError } = await (
          supabase.from("users") as any
        )
          .select("better_self_avatar_url")
          .eq("id", user.id)
          .single();

        if (!fetchError && !userData?.better_self_avatar_url) {
          console.log(
            "⚠️ Better self avatar missing, showing avatar creation again",
          );
          // Reset state to show avatar creation for better self
          setAvatarUri(null);
          setAvatarType("betterSelf");
          setExistingAvatarUrl(avatarUrl);
          setShowExistingAvatar(true);
          setIsUploading(false);
          return;
        }

        // Navigate to home screen
        router.push({
          pathname: "/screens/home",
          params: { showGoalSetup: "true" },
        });
      } else {
        // For better self avatar: Just upload the photo, don't generate yet
        // The generation happens when user clicks "Generate Better Self Avatar"
        const fileName = `avatar-betterself-${Date.now()}.jpg`;
        console.log("📸 Uploading better self avatar photo:", fileName);

        const response = await fetch(avatarUri);
        const blob = await response.blob();

        // Get auth token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          Alert.alert("Error", "Authentication failed");
          setIsUploading(false);
          return;
        }

        // Upload to storage
        const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/avatars/${user.id}/${fileName}`;

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "image/jpeg",
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          console.error("Upload failed:", uploadResponse.status);
          Alert.alert("Error", "Failed to upload avatar");
          setIsUploading(false);
          return;
        }

        // Get public URL
        const betterSelfPhotoUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/${fileName}`;
        console.log("✅ Better self photo uploaded:", betterSelfPhotoUrl);

        // Update user profile with better self avatar URL
        const { error: updateError } = await (supabase.from("users") as any)
          .update({ better_self_avatar_url: betterSelfPhotoUrl })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating user profile:", updateError);
          Alert.alert("Error", "Failed to save avatar");
          setIsUploading(false);
          return;
        }

        console.log("✅ User profile updated with better self avatar URL");

        // Navigate to home screen
        router.push({
          pathname: "/screens/home",
          params: { showGoalSetup: "true" },
        });
      }
    } catch (error: any) {
      console.error("Error in handleContinue:", error);
      Alert.alert("Error", "Failed to process avatar: " + error.message);
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setAvatarUri(null);
    handleOpenCamera();
  };

  const handleOpenCamera = async () => {
    try {
      // Launch native camera directly
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log("Avatar photo taken via native camera:", photo.uri);
        setAvatarUri(photo.uri);
      } else {
        console.log("User cancelled camera");
      }
    } catch (error: any) {
      console.error("ERROR in native camera:", error);
      Alert.alert("Error", "Failed to take photo: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCheckingData) {
    const rotateAnim = new Animated.Value(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();

    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <Animated.View
            style={{
              transform: [
                {
                  rotateZ: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          >
            <MaterialCommunityIcons
              name="camera-outline"
              size={60}
              color={PRIMARY_GREEN}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

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

        {/* Show generated avatar */}
        {showGeneratedAvatar && generatedAvatarUrl && (
          <View
            style={[
              styles.generatedAvatarCard,
              { backgroundColor: isDarkMode ? "#1A3A2A" : "#E8F5E9" },
            ]}
          >
            <Text
              style={[styles.generatedAvatarTitle, { color: textColor }]}
            >
              {aspirationSummary
                ? `Meet your better self that will help you ${aspirationSummary.trim().replace(/^(i want to|i wanna|i wish to|my goal is to|to)\s*/i, "")}`
                : "Meet your better self — your guide to becoming who you want to be."}
            </Text>

            <View
              style={[
                styles.generatedAvatarPreview,
                { borderColor: PRIMARY_GREEN },
              ]}
            >
              <Image
                source={{ uri: generatedAvatarUrl }}
                style={styles.generatedAvatarImage}
              />
            </View>

            <View style={styles.generatedAvatarButtonsContainer}>
              <OnboardingButton
                onPress={async () => {
                  if (!user?.id) {
                    Alert.alert("Error", "User not authenticated");
                    return;
                  }

                  try {
                    const { getNextOnboardingScreen } =
                      await import("@/app/lib/onboardingNavigation");
                    const nextScreen = await getNextOnboardingScreen(user.id);

                    if (nextScreen) {
                      router.push(nextScreen as any);
                    } else {
                      router.push("/screens/home");
                    }
                  } catch (error) {
                    console.error("Error determining next screen:", error);
                    router.push("/screens/home");
                  }
                }}
                buttonColor={PRIMARY_GREEN}
                disabledColor="#7A8A9A"
                shadowColor={PRIMARY_GREEN}
                disabledShadowColor="#7A8A9A"
              >
                Continue
              </OnboardingButton>
            </View>
          </View>
        )}

        {/* Show existing avatar if any */}
        {showExistingAvatar && !avatarUri && !showGeneratedAvatar && (
          <View
            style={[
              styles.existingAvatarCard,
              { backgroundColor: isDarkMode ? "#1A3A2A" : "#E8F5E9" },
            ]}
          >
            <Text
              style={[styles.existingAvatarTitle, { color: PRIMARY_GREEN }]}
            >
              👤{" "}
              {avatarType === "profile"
                ? "This is your current Profile Avatar"
                : "This is your current Profile Avatar"}
            </Text>
            <Text
              style={[styles.existingAvatarSubtitle, { color: subtitleColor }]}
            >
              {avatarType === "profile"
                ? "Do you want to keep it or create a new one?"
                : "Now let's create your Better Self Avatar - the person you're becoming"}
            </Text>

            <View
              style={[
                styles.existingAvatarPreview,
                { borderColor: PRIMARY_GREEN },
              ]}
            >
              <Image
                source={{ uri: existingAvatarUrl || "" }}
                style={styles.existingAvatarImage}
              />
            </View>

            <View style={styles.existingAvatarButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.keepAvatarButton,
                  {
                    backgroundColor: PRIMARY_GREEN,
                    opacity: isUploading ? 0.7 : 1,
                  },
                ]}
                onPress={async () => {
                  if (!user?.id) {
                    Alert.alert("Error", "User not authenticated");
                    return;
                  }

                  setIsUploading(true);
                  console.log(
                    `🎨 Keep This Avatar clicked for ${avatarType}...`,
                  );

                  try {
                    // Check if we need to create better self avatar
                    if (avatarType === "profile") {
                      console.log(
                        "✅ Profile avatar kept, checking for better self avatar...",
                      );

                      const { data: userData, error: fetchError } = await (
                        supabase.from("users") as any
                      )
                        .select("better_self_avatar_url")
                        .eq("id", user.id)
                        .single();

                      if (fetchError) {
                        throw new Error("Failed to fetch user data");
                      }

                      if (!userData?.better_self_avatar_url) {
                        console.log(
                          "⚠️ Better self avatar missing, showing avatar creation again",
                        );
                        setAvatarUri(null);
                        setAvatarType("betterSelf");
                        setShowExistingAvatar(true);
                        setIsUploading(false);
                        return;
                      }
                    } else {
                      // Better self avatar - generate it
                      console.log("⚠️ Generating better self avatar...");

                      // Call generate-avatar function with profile avatar URL
                      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-avatar`;
                      console.log("🔗 Calling generate-avatar...");

                      const response = await fetch(url, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                        },
                        body: JSON.stringify({
                          userId: user.id,
                          photoUrl: existingAvatarUrl,
                        }),
                      });

                      console.log("📊 Response status:", response.status);

                      if (!response.ok) {
                        const errorData = await response.json();
                        console.error("❌ Error response:", errorData);

                        let errorMessage = "Failed to generate avatar";
                        if (errorData.suggestion) {
                          errorMessage = errorData.suggestion;
                        } else if (errorData.error) {
                          errorMessage = errorData.error;
                        }

                        Alert.alert("Avatar Generation Issue", errorMessage, [
                          {
                            text: "Continue",
                            onPress: () => {
                              router.push({
                                pathname: "/screens/home",
                                params: { showGoalSetup: "true" },
                              });
                            },
                          },
                          {
                            text: "Try Again",
                            style: "cancel",
                          },
                        ]);
                        setIsUploading(false);
                        return;
                      }

                      const data = await response.json();
                      console.log("✅ Avatar generation response received");
                      console.log(
                        "📊 Full response:",
                        JSON.stringify(data, null, 2),
                      );
                      console.log("🎯 Transformation Prompt:");
                      console.log(
                        "═══════════════════════════════════════════════════════════",
                      );
                      console.log(data.transformationPrompt);
                      console.log(
                        "═══════════════════════════════════════════════════════════",
                      );
                      console.log("🖼️ Image URL:", data.imageUrl);

                      // Save the generated avatar to database
                      const { error: updateError } = await (
                        supabase.from("users") as any
                      )
                        .update({ better_self_avatar_url: data.imageUrl })
                        .eq("id", user.id);

                      if (updateError) {
                        console.error("❌ Database error:", updateError);
                        throw updateError;
                      }

                      console.log("✅ Better self avatar saved to database");

                      // Show the generated avatar instead of navigating
                      setGeneratedAvatarUrl(data.imageUrl);
                      setShowGeneratedAvatar(true);
                      // Fetch aspiration summary
                      fetchAspirationSummary();
                    }

                    setIsUploading(false);
                  } catch (error: any) {
                    console.error("🚨 Error:", error);
                    Alert.alert(
                      "Error",
                      error.message || "Failed to process avatar",
                    );
                    setIsUploading(false);
                  }
                }}
                disabled={isUploading}
              >
                <Text style={styles.keepAvatarButtonText}>
                  {isUploading
                    ? "Processing..."
                    : avatarType === "profile"
                      ? "Keep This Avatar"
                      : "Generate Better Self Avatar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!showExistingAvatar && (
          <>
            <Text style={[styles.title, { color: textColor }]}>
              {avatarType === "profile"
                ? "Create Your Profile Avatar"
                : "Create Your Better Self Avatar"}
            </Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {avatarType === "profile"
                ? "Take a selfie - this is you, right now"
                : "Take a selfie - this is your better self, your mentor, your guide"}
            </Text>
          </>
        )}

        {!showExistingAvatar && (
          <>
            {avatarUri ? (
              <>
                <View
                  style={[styles.avatarPreview, { borderColor: PRIMARY_GREEN }]}
                >
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                  />
                </View>

                <View style={styles.confirmContainer}>
                  <Text style={[styles.confirmText, { color: textColor }]}>
                    This is your Better Self
                  </Text>
                  <Text
                    style={[styles.confirmSubtext, { color: subtitleColor }]}
                  >
                    They will guide you daily to become who you said you'd
                    become
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.retakeButton,
                      { borderColor: PRIMARY_GREEN },
                    ]}
                    onPress={handleRetake}
                    disabled={isProcessing}
                  >
                    <MaterialCommunityIcons
                      name="camera-retake"
                      size={20}
                      color={PRIMARY_GREEN}
                    />
                    <Text
                      style={[
                        styles.retakeButtonText,
                        { color: PRIMARY_GREEN },
                      ]}
                    >
                      Retake Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.continueButtonContainer}>
                  <OnboardingButton
                    onPress={handleContinue}
                    buttonColor={PRIMARY_GREEN}
                    disabledColor="#7A8A9A"
                    shadowColor={PRIMARY_GREEN}
                    disabledShadowColor="#7A8A9A"
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Let's Go"}
                  </OnboardingButton>
                </View>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.cameraPrompt,
                    { backgroundColor: cardBg, borderColor: borderColor },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={64}
                    color={PRIMARY_GREEN}
                  />
                  <Text style={[styles.promptText, { color: textColor }]}>
                    Ready to meet your better self?
                  </Text>
                  <Text
                    style={[styles.promptSubtext, { color: subtitleColor }]}
                  >
                    Take a clear selfie to create your avatar
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.cameraButton,
                      { backgroundColor: PRIMARY_GREEN },
                    ]}
                    onPress={handleOpenCamera}
                    disabled={isProcessing}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.cameraButtonText}>Open Camera</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.disclaimer, { color: subtitleColor }]}>
                  Your avatar will be your daily reminder of who you're becoming
                </Text>
              </>
            )}
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
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
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
  cameraPrompt: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 40,
    alignItems: "center",
    marginBottom: 32,
  },
  promptText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  promptSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  avatarPreview: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    borderWidth: 3,
    overflow: "hidden",
    marginBottom: 24,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  confirmContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  confirmText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 16,
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 12,
  },
  cameraButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  continueButtonContainer: {
    marginTop: 24,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  existingAvatarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  existingAvatarTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  existingAvatarSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  existingAvatarPreview: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  existingAvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  existingAvatarButtonsContainer: {
    gap: 12,
  },
  keepAvatarButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  keepAvatarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  generatedAvatarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  generatedAvatarTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  generatedAvatarSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  generatedAvatarPreview: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  generatedAvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  generatedAvatarButtonsContainer: {
    gap: 12,
  },
});
