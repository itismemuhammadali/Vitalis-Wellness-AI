import { Level } from "@/lib/gamification/types";
import { getLevelColor } from "@/lib/gamification/xp-system";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

const PRIMARY_GREEN = "#58CC02";
const ACCENT_BLUE = "#1F9FFF";
const ACCENT_RED = "#FF6B6B";
const ACCENT_PURPLE = "#A78BFA";
const ACCENT_GOLD = "#FFD700";

// ============================================================================
// XP BAR COMPONENT
// ============================================================================

interface XPBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: Level;
  progress: number; // 0-100
  isDarkMode: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  xpToNextLevel,
  level,
  progress,
  isDarkMode,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // Calculate level number from currentXP
  const levelNumber = Math.floor(currentXP / 50) + 1;
  const nextLevelNumber = levelNumber + 1;

  // Get achievement based on level number
  const getAchievementFromLevel = (level: number): string => {
    if (level <= 5) return "Beginner";
    if (level <= 15) return "Achiever";
    if (level <= 30) return "Streakholder";
    if (level <= 50) return "Consistent";
    if (level <= 75) return "Elite";
    return "King";
  };

  // Get icon based on achievement
  const getAchievementIcon = (achievement: string): string => {
    switch (achievement) {
      case "Beginner":
        return "🚀"; // Rocket
      case "Achiever":
        return "🎯"; // Dartboard
      case "Streakholder":
        return "🔥"; // Fire
      case "Consistent":
        return "💎"; // Diamond
      case "Elite":
        return "🏆"; // Trophy
      case "King":
        return "👑"; // Crown
      default:
        return "🚀";
    }
  };

  const currentAchievement = getAchievementFromLevel(levelNumber);
  const nextAchievement = getAchievementFromLevel(nextLevelNumber);
  const achievementIcon = getAchievementIcon(currentAchievement);

  const levelColor = getLevelColor(level);
  const bgColor = isDarkMode ? "#1A2332" : "#FFFFFF";
  const textColor = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const borderColor = isDarkMode ? "#2A3A4A" : "#E0E0E0";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)";

  return (
    <View
      style={[
        styles.xpBarContainer,
        {
          backgroundColor: levelColor,
          borderColor: levelColor,
        },
        Platform.OS === "ios" && {
          shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
    >
      {/* Header with Level Badge */}
      <View style={styles.xpBarHeader}>
        <View style={styles.levelBadgeWrapper}>
          <Text style={styles.levelBadgeEmoji}>{achievementIcon}</Text>
          <Text style={[styles.levelBadgeText, { color: "#FFFFFF" }]}>
            {currentAchievement}
          </Text>
        </View>
        <Text style={[styles.xpText, { color: "#FFFFFF" }]}>
          {currentXP} XP
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBarContainer,
          { backgroundColor: "rgba(255,255,255,0.3)" },
        ]}
      >
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: progressWidth, backgroundColor: "#FFFFFF" },
          ]}
        />
      </View>

      {/* Footer */}
      <Text style={[styles.xpDescription, { color: "rgba(255,255,255,0.8)" }]}>
        {xpToNextLevel} XP to Level {nextLevelNumber}
      </Text>
    </View>
  );
};

// ============================================================================
// STREAK COUNTER COMPONENT
// ============================================================================

interface StreakCounterProps {
  streak: number;
  longestStreak: number;
  isDarkMode: boolean;
  animated?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  longestStreak,
  isDarkMode,
  animated = false,
}) => {
  // Use vibrant orange for streak card - shows fire icon clearly
  const streakColor = "#FF8C00";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)";

  return (
    <View
      style={[
        styles.streakContainer,
        {
          backgroundColor: streakColor,
          borderColor: streakColor,
        },
        Platform.OS === "ios" && {
          shadowColor: streakColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
    >
      <View style={styles.streakContent}>
        <Text style={styles.streakFlame}>🔥</Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakNumber, { color: "#FFFFFF" }]}>
            {streak}
          </Text>
          <Text
            style={[styles.streakLabel, { color: "rgba(255,255,255,0.8)" }]}
          >
            day streak
          </Text>
        </View>
      </View>

      {longestStreak > streak && (
        <Text
          style={[styles.longestStreakText, { color: "rgba(255,255,255,0.8)" }]}
        >
          Best: {longestStreak}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// LEVEL BADGE COMPONENT
// ============================================================================

interface LevelBadgeProps {
  level: Level;
  isDarkMode: boolean;
  size?: "small" | "medium" | "large";
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  isDarkMode,
  size = "medium",
}) => {
  const levelColor = getLevelColor(level);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const sizeStyles = {
    small: { width: 60, height: 60, fontSize: 24 },
    medium: { width: 80, height: 80, fontSize: 32 },
    large: { width: 120, height: 120, fontSize: 48 },
  };

  const style = sizeStyles[size];
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)";

  return (
    <Animated.View
      style={[
        styles.levelBadge,
        {
          width: style.width,
          height: style.height,
          backgroundColor: levelColor,
          transform: [{ scale: scaleAnim }],
        },
        Platform.OS === "ios" && {
          shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
    >
      <Text style={{ fontSize: style.fontSize }}>
        {level === "Beginner" && "🌱"}
        {level === "Consistent" && "📈"}
        {level === "Elite" && "👑"}
        {level === "Unbreakable" && "💎"}
      </Text>
      <Text
        style={{
          fontSize: size === "small" ? 10 : size === "medium" ? 12 : 14,
          fontWeight: "600",
          color: "#FFFFFF",
          marginTop: 4,
        }}
      >
        {level}
      </Text>
    </Animated.View>
  );
};

// ============================================================================
// XP POPUP COMPONENT
// ============================================================================

interface XPPopupProps {
  amount: number;
  visible: boolean;
  isDarkMode: boolean;
}

export const XPPopup: React.FC<XPPopupProps> = ({
  amount,
  visible,
  isDarkMode,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.xpPopup,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.xpPopupText}>+{amount} XP</Text>
    </Animated.View>
  );
};

// ============================================================================
// ACHIEVEMENT BADGE COMPONENT
// ============================================================================

interface AchievementBadgeProps {
  title: string;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  isDarkMode: boolean;
  size?: "small" | "medium";
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  icon,
  xpReward,
  isUnlocked,
  isDarkMode,
  size = "medium",
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUnlocked) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isUnlocked]);

  const bgColor = isUnlocked
    ? isDarkMode
      ? "#2A3A4A"
      : "#F0F0F0"
    : isDarkMode
      ? "#1A2332"
      : "#E8E8E8";

  const textColor = isUnlocked
    ? isDarkMode
      ? "#FFFFFF"
      : "#1F1F1F"
    : isDarkMode
      ? "#666666"
      : "#999999";

  const sizeStyles = {
    small: { width: 70, height: 70, fontSize: 28 },
    medium: { width: 90, height: 90, fontSize: 36 },
  };

  const style = sizeStyles[size];
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)";

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.achievementBadge,
        {
          width: style.width,
          height: style.height,
          backgroundColor: bgColor,
          opacity: isUnlocked ? 1 : 0.5,
          transform: [{ scale: scaleAnim }],
        },
        isUnlocked &&
          Platform.OS === "ios" && {
            shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          },
        isUnlocked &&
          Platform.OS === "android" && {
            elevation: 5,
          },
      ]}
    >
      <Animated.Text
        style={{
          fontSize: style.fontSize,
          transform: isUnlocked ? [{ rotate: rotateInterpolate }] : [],
        }}
      >
        {icon}
      </Animated.Text>
      {isUnlocked && (
        <View
          style={[
            styles.achievementCheckmark,
            { backgroundColor: PRIMARY_GREEN },
          ]}
        >
          <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );
};

// ============================================================================
// GAMIFICATION STATS COMPONENT
// ============================================================================

interface GamificationStatsProps {
  totalXP: number;
  longestStreak: number;
  goalsCompleted: number;
  achievementsUnlocked: number;
  currentAchievement?: string;
  isDarkMode: boolean;
}

export const GamificationStats: React.FC<GamificationStatsProps> = ({
  totalXP,
  longestStreak,
  goalsCompleted,
  achievementsUnlocked,
  currentAchievement = "Beginner",
  isDarkMode,
}) => {
  const bgColor = "#58CC02";
  const textColor = "#FFFFFF";
  const borderColor = "#58CC02";
  const shadowColor = "rgba(0,0,0,0.5)";

  // Get icon based on achievement
  const getAchievementIcon = (achievement: string): string => {
    switch (achievement) {
      case "Beginner":
        return "🚀"; // Rocket
      case "Achiever":
        return "🎯"; // Dartboard
      case "Streakholder":
        return "🔥"; // Fire
      case "Consistent":
        return "💎"; // Diamond
      case "Elite":
        return "🏆"; // Trophy
      case "King":
        return "👑"; // Crown
      default:
        return "🚀";
    }
  };

  const stats = [
    {
      label: "Achievement",
      value: currentAchievement,
      icon: getAchievementIcon(currentAchievement),
      color: "#FFFFFF",
      bgColor: "rgba(255,255,255,0.2)",
    },
    {
      label: "Total XP",
      value: totalXP,
      icon: "⭐",
      color: "#FFFFFF",
      bgColor: "rgba(255,255,255,0.2)",
    },
    {
      label: "Best Streak",
      value: longestStreak,
      icon: "🔥",
      color: "#FFFFFF",
      bgColor: "rgba(255,255,255,0.2)",
    },
  ];

  return (
    <View
      style={[
        styles.statsContainer,
        { backgroundColor: bgColor, borderColor },
        Platform.OS === "ios" && {
          shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
    >
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: stat.bgColor },
            ]}
          >
            <Text style={styles.statIcon}>{stat.icon}</Text>
          </View>
          <Text style={[styles.statValue, { color: stat.color }]}>
            {stat.value}
          </Text>
          <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.8)" }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// GOAL COMPLETION POPUP COMPONENT
// ============================================================================

interface GoalCompletionPopupProps {
  visible: boolean;
  goalTitle: string;
  xpEarned: number;
  isDarkMode: boolean;
  onDismiss: () => void;
}

export const GoalCompletionPopup: React.FC<GoalCompletionPopupProps> = ({
  visible,
  goalTitle,
  xpEarned,
  isDarkMode,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bgColor = isDarkMode ? "#1A2332" : "#FFFFFF";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

  return (
    <View style={styles.popupOverlay}>
      <Animated.View
        style={[
          styles.goalCompletionPopup,
          {
            backgroundColor: bgColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
          Platform.OS === "ios" && {
            shadowColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          },
          Platform.OS === "android" && {
            elevation: 12,
          },
        ]}
      >
        {/* Celebration Icon */}
        <Animated.Text
          style={[
            styles.celebrationIcon,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          🎉
        </Animated.Text>

        {/* Title */}
        <Text style={[styles.popupTitle, { color: PRIMARY_GREEN }]}>
          Goal Completed!
        </Text>

        {/* Goal Name */}
        <Text
          style={[
            styles.popupGoalTitle,
            { color: isDarkMode ? "#FFFFFF" : "#1F1F1F" },
          ]}
        >
          {goalTitle}
        </Text>

        {/* XP Reward */}
        <View style={styles.xpRewardContainer}>
          <Text style={styles.xpRewardIcon}>⭐</Text>
          <Text style={styles.xpRewardText}>+{xpEarned} XP</Text>
        </View>

        {/* Motivational Message */}
        <Text
          style={[
            styles.motivationalText,
            { color: isDarkMode ? "#B0B0B0" : "#757575" },
          ]}
        >
          Keep up the amazing work!
        </Text>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// ACHIEVEMENT UNLOCKED POPUP COMPONENT
// ============================================================================

interface AchievementUnlockedPopupProps {
  visible: boolean;
  achievementTitle: string;
  achievementIcon: string;
  xpReward: number;
  isDarkMode: boolean;
  onDismiss: () => void;
}

export const AchievementUnlockedPopup: React.FC<
  AchievementUnlockedPopupProps
> = ({
  visible,
  achievementTitle,
  achievementIcon,
  xpReward,
  isDarkMode,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 },
        ),
        Animated.delay(1000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  const bounceInterpolate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const bgColor = isDarkMode ? "#1A2332" : "#FFFFFF";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

  return (
    <View style={styles.popupOverlay}>
      <Animated.View
        style={[
          styles.achievementUnlockedPopup,
          {
            backgroundColor: bgColor,
            transform: [
              { scale: scaleAnim },
              { translateY: bounceInterpolate },
            ],
            opacity: opacityAnim,
          },
          Platform.OS === "ios" && {
            shadowColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          },
          Platform.OS === "android" && {
            elevation: 12,
          },
        ]}
      >
        {/* Achievement Icon */}
        <Text style={styles.achievementUnlockedIcon}>{achievementIcon}</Text>

        {/* Title */}
        <Text style={[styles.popupTitle, { color: ACCENT_GOLD }]}>
          Achievement Unlocked!
        </Text>

        {/* Achievement Name */}
        <Text
          style={[
            styles.popupGoalTitle,
            { color: isDarkMode ? "#FFFFFF" : "#1F1F1F" },
          ]}
        >
          {achievementTitle}
        </Text>

        {/* XP Reward */}
        <View style={styles.xpRewardContainer}>
          <Text style={styles.xpRewardIcon}>⭐</Text>
          <Text style={styles.xpRewardText}>+{xpReward} XP</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// STREAK MILESTONE POPUP COMPONENT
// ============================================================================

interface StreakMilestonePopupProps {
  visible: boolean;
  streakCount: number;
  isDarkMode: boolean;
  onDismiss: () => void;
}

export const StreakMilestonePopup: React.FC<StreakMilestonePopupProps> = ({
  visible,
  streakCount,
  isDarkMode,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bgColor = isDarkMode ? "#1A2332" : "#FFFFFF";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

  return (
    <View style={styles.popupOverlay}>
      <Animated.View
        style={[
          styles.streakMilestonePopup,
          {
            backgroundColor: bgColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
          Platform.OS === "ios" && {
            shadowColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          },
          Platform.OS === "android" && {
            elevation: 12,
          },
        ]}
      >
        {/* Fire Icon */}
        <Animated.Text
          style={[
            styles.streakMilestoneIcon,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          🔥
        </Animated.Text>

        {/* Title */}
        <Text style={[styles.popupTitle, { color: "#FF8C00" }]}>
          Streak Milestone!
        </Text>

        {/* Streak Count */}
        <Text style={[styles.streakMilestoneCount, { color: "#FF8C00" }]}>
          {streakCount} Days
        </Text>

        {/* Motivational Message */}
        <Text
          style={[
            styles.motivationalText,
            { color: isDarkMode ? "#B0B0B0" : "#757575" },
          ]}
        >
          You're on fire! Keep it going!
        </Text>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// SUCCESS CONFIRMATION POPUP COMPONENT
// ============================================================================

interface SuccessConfirmationPopupProps {
  visible: boolean;
  message: string;
  isDarkMode: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const SuccessConfirmationPopup: React.FC<
  SuccessConfirmationPopupProps
> = ({ visible, message, isDarkMode, onDismiss, duration = 2000 }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(duration),
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = isDarkMode ? "#1A2332" : "#FFFFFF";
  const shadowColor = isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

  return (
    <Animated.View
      style={[
        styles.successConfirmationPopup,
        {
          backgroundColor: bgColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        Platform.OS === "ios" && {
          shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="check-circle"
        size={24}
        color={PRIMARY_GREEN}
      />
      <Text
        style={[
          styles.successMessage,
          { color: isDarkMode ? "#FFFFFF" : "#1F1F1F" },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // XP Bar
  xpBarContainer: {
    borderRadius: 20,
    borderWidth: 0,
    padding: 20,
    marginBottom: 16,
  },
  xpBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelBadgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelBadgeEmoji: {
    fontSize: 24,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  xpText: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  xpDescription: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  // Streak Counter
  streakContainer: {
    borderRadius: 20,
    borderWidth: 0,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 140,
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  streakFlame: {
    fontSize: 48,
  },
  streakInfo: {
    justifyContent: "center",
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "bold",
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  longestStreakText: {
    fontSize: 13,
    fontWeight: "600",
  },
  streakGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    borderWidth: 2,
  },

  // XP Popup
  xpPopup: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    marginLeft: -30,
    backgroundColor: ACCENT_GOLD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  xpPopupText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Achievement Badge
  achievementBadge: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  achievementCheckmark: {
    position: "absolute",
    bottom: -4,
    right: -4,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats
  statsContainer: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },

  // Popup Overlay
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  // Goal Completion Popup
  goalCompletionPopup: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
  },
  celebrationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  popupGoalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  xpRewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    backgroundColor: ACCENT_GOLD + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  xpRewardIcon: {
    fontSize: 20,
  },
  xpRewardText: {
    fontSize: 16,
    fontWeight: "700",
    color: ACCENT_GOLD,
  },
  motivationalText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  // Achievement Unlocked Popup
  achievementUnlockedPopup: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
  },
  achievementUnlockedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  // Streak Milestone Popup
  streakMilestonePopup: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
  },
  streakMilestoneIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  streakMilestoneCount: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },

  // Success Confirmation Popup
  successConfirmationPopup: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1000,
  },
  successMessage: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
