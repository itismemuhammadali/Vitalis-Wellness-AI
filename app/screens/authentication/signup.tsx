import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Modal,
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
import LegalModal from "../../components/LegalModal";

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

export default function SignUpScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { signUp, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Legal Modal State
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy">("terms");

  const openLegalModal = (type: "terms" | "privacy") => {
    setLegalModalType(type);
    setLegalModalVisible(true);
  };

  const handleSignUp = async () => {
    setErrorMessage("");
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms & Conditions");
      return;
    }

    try {
      await signUp(email, password, fullName);
      setShowSuccessModal(true);
      // Don't redirect — wait for user to confirm email
    } catch (error: any) {
      const errorMessage = error.message || "Sign up failed. Please try again.";

      // Handle specific error cases
      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("already exists")
      ) {
        setErrorMessage(
          `An account with the email "${email}" already exists. Please use a different email or try logging in.`,
        );
      } else if (errorMessage.includes("invalid email")) {
        setErrorMessage("Please enter a valid email address.");
      } else if (errorMessage.includes("password")) {
        setErrorMessage("Password must be at least 6 characters.");
      } else {
        setErrorMessage(errorMessage);
      }
    }
  };

  const handleDateConfirm = (date: Date) => {
    setDateOfBirth(date);
    setShowDatePicker(false);
  };

  const handleDatePickerPress = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? LIGHT_TEXT : DARK_TEXT;
  const inputBgColor = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const inputBorderColor = isDarkMode ? DARK_INPUT_BORDER : LIGHT_INPUT_BORDER;
  const subtitleColor = isDarkMode ? LIGHT_SUBTITLE : DARK_SUBTITLE;
  const iconColor = isDarkMode ? LIGHT_TEXT : DARK_TEXT;
  const buttonBgColor = agreeTerms ? PRIMARY_GREEN : "#555555";

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Sign Up
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>
          Create Account 🚀
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Start your amazing learning journey!
        </Text>

        {/* Full Name Input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: inputBgColor, borderColor: inputBorderColor },
          ]}
        >
          <Feather
            name="user"
            size={20}
            color={iconColor}
            style={styles.iconMargin}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Full Name"
            placeholderTextColor={subtitleColor}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

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
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color={iconColor}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
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

        {/* Terms & Conditions Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: inputBorderColor,
                backgroundColor: agreeTerms ? PRIMARY_GREEN : "transparent",
              },
            ]}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.legalLinksContainer}>
            <Text style={[styles.checkboxLabel, { color: textColor }]}>
              I agree to the{" "}
            </Text>
            <TouchableOpacity onPress={() => openLegalModal("terms")}>
              <Text style={[styles.legalLink, { color: PRIMARY_GREEN }]}>
                Terms & Conditions
              </Text>
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: textColor }]}> and </Text>
            <TouchableOpacity onPress={() => openLegalModal("privacy")}>
              <Text style={[styles.legalLink, { color: PRIMARY_GREEN }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View
            style={[
              styles.errorContainer,
              {
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                borderColor: "rgba(255, 107, 107, 0.3)",
              },
            ]}
          >
            <View style={styles.errorContent}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          </View>
        ) : null}

        {/* Create Account Button */}
        <PressableButton
          onPress={handleSignUp}
          disabled={!agreeTerms || loading}
          buttonColor={PRIMARY_GREEN}
          disabledColor="#555555"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </PressableButton>

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={[styles.loginLinkText, { color: subtitleColor }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.loginLink, { color: PRIMARY_GREEN }]}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successOverlay}>
          <View style={[styles.successModal, { backgroundColor: bgColor }]}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={[styles.successTitle, { color: textColor }]}>
              Check Your Email
            </Text>
            <Text style={[styles.successMessage, { color: subtitleColor }]}>
              A confirmation email has been sent to{"\n"}
              <Text style={{ color: PRIMARY_GREEN, fontWeight: "700" }}>{email}</Text>
              {"\n\n"}Open the email and click the confirmation button to get started.
            </Text>
          </View>
        </View>
      </Modal>

      <LegalModal
        visible={legalModalVisible}
        type={legalModalType}
        onClose={() => setLegalModalVisible(false)}
      />
    </>
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  legalLinksContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  legalLink: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: 20,
    marginTop: 10,
    position: "relative",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "bold",
  },
  errorContainer: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

