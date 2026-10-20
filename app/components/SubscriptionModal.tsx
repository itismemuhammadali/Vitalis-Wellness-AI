import { useTheme } from "@/context/ThemeContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (tier: "basic" | "premium") => Promise<void>;
  type: "must_subscribe" | "upgrade_premium";
}

const PRIMARY_GREEN = "#58CC02";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const DARK_CARD_BG = "#1A2332";
const LIGHT_CARD_BG = "#FFFFFF";
const DARK_BORDER = "#2A3A4A";
const LIGHT_BORDER = "#E0E0E0";

export default function SubscriptionModal({
  visible,
  onClose,
  onSubscribe,
  type,
}: SubscriptionModalProps) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [selectedTier, setSelectedTier] = React.useState<"basic" | "premium" | null>(null);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  const handleSubscribe = async (tier: "basic" | "premium") => {
    try {
      setLoading(true);
      setSelectedTier(tier);
      await onSubscribe(tier);
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to process subscription. Please try again.");
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const isMustSubscribe = type === "must_subscribe";
  const title = isMustSubscribe
    ? "🚀 Ready to Continue Your Journey?"
    : "⚠️ Daily Message Limit Reached";
  const subtitle = isMustSubscribe
    ? "You've experienced the power of your better self! Subscribe to Basic plan to continue your transformation."
    : "You've reached your daily limit of 40 messages. Upgrade to Premium to continue chatting with unlimited access.";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* No Close Button - User must subscribe */}

            {/* Header */}
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              {subtitle}
            </Text>

            {/* Basic Plan - $9.99 (Only when must subscribe) */}
            {isMustSubscribe && (
              <TouchableOpacity
                style={[
                  styles.planCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: "#1F9FFF",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handleSubscribe("basic")}
                disabled={loading}
              >
                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, { color: "#1F9FFF" }]}>
                      Basic Plan
                    </Text>
                    <Text style={[styles.planPrice, { color: textColor }]}>
                      $9.99<Text style={styles.planPeriod}>/month</Text>
                    </Text>
                  </View>
                  {loading && selectedTier === "basic" ? (
                    <ActivityIndicator size="small" color="#1F9FFF" />
                  ) : (
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={28}
                      color="#1F9FFF"
                    />
                  )}
                </View>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={PRIMARY_GREEN}
                    />
                    <Text style={[styles.featureText, { color: textColor }]}>
                      40 messages per day
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={PRIMARY_GREEN}
                    />
                    <Text style={[styles.featureText, { color: textColor }]}>
                      Advanced goal tracking
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={PRIMARY_GREEN}
                    />
                    <Text style={[styles.featureText, { color: textColor }]}>
                      Priority support
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Premium Plan - $19.99 (Only for message limit) */}
            {!isMustSubscribe && (
              <TouchableOpacity
                style={[
                  styles.planCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: "#FFB84D",
                    borderWidth: 2,
                  },
                Platform.OS === "ios" && {
                  shadowColor: "#FFB84D",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                },
                Platform.OS === "android" && {
                  elevation: 10,
                },
              ]}
              onPress={() => handleSubscribe("premium")}
              disabled={loading}
            >
              <View style={[styles.badge, { backgroundColor: "#FFB84D" }]}>
                <Text style={styles.badgeText}>⭐ MOST POPULAR</Text>
              </View>

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: "#FFB84D" }]}>
                    Premium Plan
                  </Text>
                  <Text style={[styles.planPrice, { color: textColor }]}>
                    $19.99<Text style={styles.planPeriod}>/month</Text>
                  </Text>
                </View>
                {loading && selectedTier === "premium" ? (
                  <ActivityIndicator size="small" color="#FFB84D" />
                ) : (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={28}
                    color="#FFB84D"
                  />
                )}
              </View>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={PRIMARY_GREEN}
                  />
                  <Text style={[styles.featureText, { color: textColor }]}>
                    Unlimited messages
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={PRIMARY_GREEN}
                  />
                  <Text style={[styles.featureText, { color: textColor }]}>
                    Advanced AI insights
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={PRIMARY_GREEN}
                  />
                  <Text style={[styles.featureText, { color: textColor }]}>
                    Personalized coaching
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={PRIMARY_GREEN}
                  />
                  <Text style={[styles.featureText, { color: textColor }]}>
                    Priority support 24/7
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={PRIMARY_GREEN}
                  />
                  <Text style={[styles.featureText, { color: textColor }]}>
                    Exclusive features
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            )}

            {/* Terms */}
            <Text style={[styles.terms, { color: textColor }]}>
              Subscriptions auto-renew monthly. Cancel anytime in your account
              settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 20,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 22,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "800",
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: "400",
    opacity: 0.7,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    fontWeight: "500",
  },
  freeButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  freeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.7,
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    marginTop: 8,
    lineHeight: 18,
  },
});
