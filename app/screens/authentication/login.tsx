import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import SimpleLineIcons from "react-native-vector-icons/SimpleLineIcons";
import LoginButton from "../../components/LoginButton";
import ThemeModal from "../../widgets/ThemeModal";

const PRIMARY_GREEN = "#58CC02";
const PRIMARY_BLUE = "#1F76D2";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_INPUT_BG = "#1A1F2E";
const LIGHT_INPUT_BG = "#FFFFFF";
const DARK_INPUT_BORDER = "#2A3142";
const LIGHT_INPUT_BORDER = "#E0E0E0";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const DARK_SUBTITLE = "#B0B0B0";
const LIGHT_SUBTITLE = "#757575";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [floatAnim] = useState(new Animated.Value(0));
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (params.toast === "account_deleted") {
      setToastMessage("Account deleted successfully");
    } else if (params.toast === "logged_out") {
      setToastMessage("You have been logged out");
    } else if (params.toast === "email_confirmed") {
      setToastMessage("Email confirmed! Please log in");
    }
    if (params.toast) {
      const t = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [params.toast]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -30,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const handleLogin = async () => {
    setErrorMessage("");
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter email and password");
      return;
    }

    try {
      await signIn(email, password);
      console.log("✅ Login successful, checking onboarding status...");

      // Get the current session to get the user ID
      const { supabase } = await import("@/lib/supabase");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        const { getNextOnboardingScreen } =
          await import("@/app/lib/onboardingNavigation");
        const nextScreen = await getNextOnboardingScreen(session.user.id);

        if (nextScreen) {
          console.log("➡️ Navigating to:", nextScreen);
          router.replace(nextScreen);
        } else {
          console.log("✅ Onboarding complete, going to home");
          router.replace("/screens/home");
        }
      }
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("rate limit") || msg.includes("too many")) {
        setErrorMessage(
          "Too many attempts. Please wait a moment and try again.",
        );
      } else if (msg.includes("Email not confirmed")) {
        setErrorMessage("Please confirm your email before logging in.");
      } else if (msg.includes("Invalid login credentials")) {
        setErrorMessage("Incorrect email or password. Please try again.");
      } else {
        setErrorMessage(msg || "Login failed. Please try again.");
      }
    }
  };

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const inputBgColor = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const inputBorderColor = isDarkMode ? DARK_INPUT_BORDER : LIGHT_INPUT_BORDER;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const iconColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;

  const handleThemeSelect = (theme: "light" | "dark" | "system") => {
    setThemeMode(theme);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Theme Toggle Button - Top Right */}
      <View style={styles.themeButtonContainer}>
        <TouchableOpacity
          style={[styles.themeButton, { borderColor: PRIMARY_GREEN }]}
          onPress={() => setThemeModalVisible(true)}
        >
          <Ionicons
            name={isDarkMode ? "sunny" : "moon"}
            size={24}
            color={PRIMARY_GREEN}
          />
        </TouchableOpacity>
      </View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <LinearGradient
            colors={[PRIMARY_GREEN, PRIMARY_BLUE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoText}>K</Text>
          </LinearGradient>
        </Animated.View>
        <Text style={styles.appName}>KYVO</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: textColor }]}>Welcome Back! 👋</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>
        Let's get back to improving!
      </Text>

      {/* Email Input */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: inputBgColor, borderColor: inputBorderColor },
        ]}
      >
        <SimpleLineIcons
          name="envelope"
          size={20}
          color={iconColor}
          style={styles.iconMargin}
        />
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Email"
          placeholderTextColor={subtitleColor}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      {/* Password Input */}
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
          placeholder="Password"
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
            name={showPassword ? "eye-off" : "eye"}
            size={18}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password Link */}
      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={() => router.push("/screens/authentication/forgot-password")}
      >
        <Text style={[styles.forgotPasswordText, { color: PRIMARY_GREEN }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={16} color="#FF6B6B" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Login Button */}
      <LoginButton
        onPress={handleLogin}
        buttonColor={PRIMARY_GREEN}
        disabledColor="#7A8A9A"
      >
        {loading ? "Logging In..." : "Log In"}
      </LoginButton>

      {/* Sign Up Link */}
      <View style={styles.signupLinkContainer}>
        <Text style={[styles.signupLinkText, { color: subtitleColor }]}>
          Don't have an account?{" "}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/screens/authentication/signup")}
        >
          <Text style={[styles.signupLink, { color: PRIMARY_GREEN }]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />

      {/* Toast */}
      {toastMessage ? (
        <View style={{
          position: "absolute",
          bottom: 60,
          left: 20,
          right: 20,
          backgroundColor: "#1A1F2E",
          borderRadius: 12,
          padding: 14,
          borderLeftWidth: 4,
          borderLeftColor: PRIMARY_GREEN,
          alignItems: "center",
        }}>
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>{toastMessage}</Text>
        </View>
      ) : null}

      {/* Theme Modal */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        themeSelection={themeMode}
        onThemeSelect={handleThemeSelect}
        isDarkMode={isDarkMode}
        textColor={textColor}
        subtitleColor={subtitleColor}
        inputBgColor={inputBgColor}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 80,
    marginTop: 15,
    alignItems: "center",
  },
  themeButtonContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  themeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  iconMargin: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    width: "100%",
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 20,
    position: "relative",
  },
  loginButton: {
    width: "100%",
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    flex: 1,
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  signupLinkText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
