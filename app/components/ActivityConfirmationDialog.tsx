import { useTheme } from "@/context/ThemeContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface MatchedGoal {
  goalId: string;
  goalTitle: string;
  goalTarget: string;
  userAchievement: string;
  completionPercentage: number;
  confidence: number;
  reasoning: string;
}

interface ActivityConfirmationDialogProps {
  visible: boolean;
  activityDescription: string;
  matchedGoals: MatchedGoal[];
  onConfirm: (selectedGoals: MatchedGoal[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

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

export default function ActivityConfirmationDialog({
  visible,
  activityDescription,
  matchedGoals,
  onConfirm,
  onCancel,
  loading = false,
}: ActivityConfirmationDialogProps) {
  const { isDarkMode } = useTheme();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    matchedGoals.map((g) => g.goalId),
  );

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId],
    );
  };

  const handleConfirm = () => {
    const selected = matchedGoals.filter((g) =>
      selectedGoals.includes(g.goalId),
    );
    onConfirm(selected);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: cardBg }]}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={PRIMARY_GREEN}
            />
            <Text style={[styles.title, { color: textColor }]}>
              Activity Detected
            </Text>
          </View>

          {/* Activity Description */}
          <View style={[styles.descriptionBox, { borderColor }]}>
            <Text style={[styles.descriptionLabel, { color: subtitleColor }]}>
              What you did:
            </Text>
            <Text style={[styles.description, { color: textColor }]}>
              {activityDescription}
            </Text>
          </View>

          {/* Matched Goals */}
          <ScrollView style={styles.goalsContainer}>
            <Text style={[styles.goalsLabel, { color: subtitleColor }]}>
              Matched Goals:
            </Text>

            {matchedGoals.map((goal) => (
              <TouchableOpacity
                key={goal.goalId}
                style={[
                  styles.goalItem,
                  {
                    backgroundColor: selectedGoals.includes(goal.goalId)
                      ? PRIMARY_GREEN + "15"
                      : "transparent",
                    borderColor,
                  },
                ]}
                onPress={() => toggleGoal(goal.goalId)}
              >
                <View style={styles.goalCheckbox}>
                  {selectedGoals.includes(goal.goalId) && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={PRIMARY_GREEN}
                    />
                  )}
                </View>

                <View style={styles.goalContent}>
                  <Text style={[styles.goalTitle, { color: textColor }]}>
                    {goal.goalTitle}
                  </Text>
                  <View style={styles.goalStats}>
                    <Text style={[styles.goalStat, { color: subtitleColor }]}>
                      {goal.userAchievement} / {goal.goalTarget}
                    </Text>
                    <Text
                      style={[styles.goalPercentage, { color: PRIMARY_GREEN }]}
                    >
                      {goal.completionPercentage}%
                    </Text>
                  </View>
                  <Text style={[styles.reasoning, { color: subtitleColor }]}>
                    {goal.reasoning}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { borderColor }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: PRIMARY_GREEN,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
              onPress={handleConfirm}
              disabled={loading || selectedGoals.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? "Logging..." : "Log Activity"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    borderRadius: 16,
    maxHeight: "80%",
    width: "100%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  descriptionBox: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  goalsContainer: {
    maxHeight: 300,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  goalsLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  goalItem: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#58CC02",
    justifyContent: "center",
    alignItems: "center",
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  goalStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  goalStat: {
    fontSize: 12,
    fontWeight: "500",
  },
  goalPercentage: {
    fontSize: 12,
    fontWeight: "700",
  },
  reasoning: {
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
