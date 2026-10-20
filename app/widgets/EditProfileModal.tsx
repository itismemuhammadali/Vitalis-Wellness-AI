import { useTheme } from "@/context/ThemeContext";
import { calculateAge } from "@/lib/utils/ageCalculator";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CalendarDatePicker from "./CalendarDatePicker";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    fullName: string;
    dateOfBirth: string;
    aspiration: string;
  }) => void;
  initialData?: {
    fullName?: string;
    dateOfBirth?: string;
    aspiration?: string;
  };
}

export default function EditProfileModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: EditProfileModalProps) {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  const [fullName, setFullName] = useState("User Name");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [aspiration, setAspiration] = useState("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());

  // Animation values
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load initial data when modal opens
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setFullName(initialData.fullName || "User Name");
        setDateOfBirth(initialData.dateOfBirth || "");
        setAspiration(initialData.aspiration || "");
        // Parse date string to Date object
        if (initialData.dateOfBirth) {
          const date = new Date(initialData.dateOfBirth);
          setSelectedDateObj(date);
        }
      } else {
        // Reset to defaults when no initial data
        setFullName("User Name");
        setDateOfBirth("");
        setAspiration("");
        setSelectedDateObj(new Date());
      }

      // Entrance animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation
      Animated.loop(
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
      ).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible, initialData]);

  // Calculate age whenever date of birth changes
  useEffect(() => {
    if (dateOfBirth) {
      const age = calculateAge(dateOfBirth);
      setCalculatedAge(age);
    }
  }, [dateOfBirth]);

  const bgColor = isDark ? "#1A1F2E" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#1F1F1F";
  const subtitleColor = isDark ? "#B0B0B0" : "#757575";
  const inputBg = isDark ? "#0F1419" : "#F5F1E8";
  const borderColor = isDark ? "#2A3142" : "#E0E0E0";
  const overlayBg = isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)";

  // Gamification colors
  const colors = {
    primary: "#58CC02",
    blue: "#1F9FFF",
    purple: "#A78BFA",
    orange: "#FFB84D",
    red: "#FF6B6B",
    gold: "#FFD700",
  };

  const isFormValid = fullName.trim();

  const handleClose = () => {
    setShowDatePicker(false);
    onClose();
  };

  const handleDateConfirm = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    setDateOfBirth(formattedDate);
    setSelectedDateObj(date);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleSubmit = () => {
    if (!isFormValid) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit?.({
      fullName,
      dateOfBirth,
      aspiration,
    });
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: overlayBg, opacity: fadeAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.gamifiedContainer,
            {
              backgroundColor: bgColor,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={[colors.purple, colors.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gamifiedHeader}
          >
            <View style={styles.headerContent}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View
                  style={[
                    styles.headerIconBg,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-edit"
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
              </Animated.View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.gamifiedHeaderTitle}>Edit Profile</Text>
                <Text style={styles.gamifiedHeaderSubtitle}>
                  Update your information
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.gamifiedCloseButton}
              onPress={handleClose}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={colors.blue}
                />
                <Text
                  style={[styles.gamifiedSectionLabel, { color: textColor }]}
                >
                  Full Name
                </Text>
              </View>
              <View style={[styles.inputWrapper, { borderColor: colors.blue }]}>
                <TextInput
                  style={[
                    styles.gamifiedInput,
                    {
                      color: textColor,
                      marginLeft: 14,
                      height: 44,
                    },
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={subtitleColor}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={colors.orange}
                  />
                  <Text
                    style={[styles.gamifiedSectionLabel, { color: textColor }]}
                  >
                    Date of Birth
                  </Text>
                </View>
                {calculatedAge !== null && (
                  <View
                    style={[
                      styles.ageBadge,
                      {
                        backgroundColor: colors.purple + "20",
                        borderColor: colors.purple,
                      },
                    ]}
                  >
                    <Text style={[styles.ageDisplay, { color: colors.purple }]}>
                      {calculatedAge} yrs
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.inputWrapper, { borderColor: colors.orange }]}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateInputContent}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={20}
                    color={colors.orange}
                  />
                  <Text
                    style={[
                      styles.gamifiedInput,
                      {
                        color: dateOfBirth ? textColor : subtitleColor,
                        flex: 1,
                        marginLeft: 8,
                        height: 44,
                        textAlignVertical: "center",
                      },
                    ]}
                  >
                    {dateOfBirth || "YYYY-MM-DD"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Aspiration */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="lightbulb"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.gamifiedSectionLabel, { color: textColor }]}
                >
                  Aspiration
                </Text>
              </View>
              <View
                style={[styles.inputWrapper, { borderColor: colors.primary }]}
              >
                <TextInput
                  style={[
                    styles.gamifiedBioInput,
                    {
                      color: textColor,
                    },
                  ]}
                  placeholder="What is your aspiration?"
                  placeholderTextColor={subtitleColor}
                  value={aspiration}
                  onChangeText={setAspiration}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.gamifiedButtonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: borderColor }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: subtitleColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { opacity: isFormValid ? 1 : 0.6 }]}
              onPress={handleSubmit}
              disabled={!isFormValid}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, "#4CAF00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Calendar Date Picker */}
          <CalendarDatePicker
            isVisible={showDatePicker}
            date={selectedDateObj}
            onConfirm={handleDateConfirm}
            onCancel={handleDateCancel}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  gamifiedContainer: {
    borderRadius: 28,
    width: "100%",
    maxHeight: "90%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#A78BFA",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  gamifiedHeader: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  headerIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  gamifiedHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  gamifiedHeaderSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  gamifiedCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: "65%",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  gamifiedSectionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  ageDisplay: {
    fontSize: 12,
    fontWeight: "700",
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
  },
  dateInputContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 2,
    minHeight: 44,
  },
  gamifiedInput: {
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: "500",
  },
  gamifiedBioInput: {
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "400",
    textAlignVertical: "top",
    minHeight: 90,
  },
  gamifiedButtonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(88, 204, 2, 0.2)",
  },
  cancelButton: {
    flex: 0.35,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 0.65,
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#58CC02",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
