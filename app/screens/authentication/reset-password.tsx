import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import Feather from "react-native-vector-icons/Feather";
import SimpleLineIcons from "react-native-vector-icons/SimpleLineIcons";
import PressableButton from "../../components/PressableButton";
import SuccessConfirmationPopup from "../../widgets/SuccessConfirmationPopup";

const PRIMARY_GREEN = "#58CC02";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_INPUT_BG = "#1A1F2E";
const LIGHT_INPUT_BG = "#FFFFFF";
const DARK_INPUT_BORDER = "#2A3142";
const LIGHT_INPUT_BORDER = "#E0E0E0";
const DARK_TEXT = "#1F1F1F";
const LIGHT_TEXT = "#FFFFFF";
const DARK_SUBTITLE = "#757575";
const LIGHT_SUBTITLE = "#B0B0B0";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Session is already set by the callback screen via PASSWORD_RECOVERY event
        // Just allow the user to set a new password
        setVerifying(false);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      }
    };

    verifyToken();
  }, [params]);

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setShowSuccessPopup(true);
      setTimeout(() => {
        router.replace("/screens/authentication/login");
      }, 2500);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? LIGHT_TEXT : DARK_TEXT;
  const inputBgColor = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const inputBorderColor = isDarkMode ? DARK_INPUT_BORDER : LIGHT_INPUT_BORDER;
  const subtitleColor = isDarkMode ? LIGHT_SUBTITLE : DARK_SUBTITLE;
  const iconColor = isDarkMode ? LIGHT_TEXT : DARK_TEXT;

  if (verifying) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        <Text
          style={[styles.subtitle, { color: subtitleColor, marginTop: 16 }]}
        >
          Verifying reset link...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={[styles.errorText, { color: "#ff6b6b" }]}>{error}</Text>
        <PressableButton
          onPress={() => router.replace("/screens/authentication/login")}
          buttonColor={PRIMARY_GREEN}
        >
          Back to Login
        </PressableButton>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Reset Password
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.title, { color: textColor }]}>
          Set New Password 🔐
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Enter your new password below
        </Text>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: inputBgColor, borderColor: inputBorderColor },
          ]}
        >
          <SimpleLineIcons
            name="lock"
            size={20}
            color={iconColor}
            style={styles.iconMargin}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="New Password"
            placeholderTextColor={subtitleColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color={iconColor}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: inputBgColor, borderColor: inputBorderColor },
          ]}
        >
          <SimpleLineIcons
            name="lock"
            size={20}
            color={iconColor}
            style={styles.iconMargin}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Confirm Password"
            placeholderTextColor={subtitleColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
          >
            <Feather
              name={showConfirmPassword ? "eye" : "eye-off"}
              size={18}
              color={iconColor}
            />
          </TouchableOpacity>
        </View>

        <PressableButton
          onPress={handleResetPassword}
          disabled={loading}
          buttonColor={PRIMARY_GREEN}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </PressableButton>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Popup */}
      <SuccessConfirmationPopup
        visible={showSuccessPopup}
        message="🎉 Password reset successfully!"
        isDarkMode={isDarkMode}
        onDismiss={() => setShowSuccessPopup(false)}
        duration={2000}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 80,
    marginTop: 15,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  iconMargin: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
});
