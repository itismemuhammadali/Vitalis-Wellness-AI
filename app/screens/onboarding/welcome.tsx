import { useAuth } from "@/app/context/AuthContext";
import { getNextOnboardingScreen } from "@/app/lib/onboardingNavigation";
import { useTheme } from "@/context/ThemeContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import LoginButton from "../../components/LoginButton";

// Color constants
const PRIMARY_GREEN = "#58CC02";
const PRIMARY_BLUE = "#1F76D2";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const DARK_SUBTITLE = "#B0B0B0";
const LIGHT_SUBTITLE = "#757575";

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  // Float animation for the K logo
  const [floatAnim] = useState(new Animated.Value(0));

  // Rotation animation for circular propeller motion
  const [rotationAnim] = useState(new Animated.Value(0));

  // Float animation effect
  useEffect(() => {
    const floatAnimation = Animated.loop(
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
    );
    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [floatAnim]);

  // Rotation animation effect
  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    rotationAnimation.start();

    return () => {
      rotationAnimation.stop();
    };
  }, [rotationAnim]);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;

  const handleGetStarted = async () => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    try {
      const nextScreen = await getNextOnboardingScreen(user.id);
      if (nextScreen) {
        router.push(nextScreen);
      } else {
        // All onboarding complete, go to home
        router.push("/screens/home");
      }
    } catch (error) {
      console.error("Error determining next screen:", error);
      router.push("/screens/onboarding/notification-permission");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Floating K Logo - Top Center */}
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

      {/* Welcome Text Block - Centered */}
      <View style={styles.textBlock}>
        <Text style={[styles.welcomeTitle, { color: textColor }]}>
          Welcome to KYVO! 🎉
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Your journey to becoming your best self starts here
        </Text>
      </View>

      {/* Animated Graphic Container */}
      <View style={styles.graphicContainer}>
        {/* Background Circle 1 - Blue (8% opacity, orbiting around trophy) */}
        <Animated.View
          style={[
            styles.orbitContainer1,
            {
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
                {
                  translateY: rotationAnim.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [-80, -40, 0, -40, -80],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.bgCircle1, { opacity: 0.08 }]} />
        </Animated.View>

        {/* Background Circle 2 - Green (8% opacity, orbiting around trophy opposite) */}
        <Animated.View
          style={[
            styles.orbitContainer2,
            {
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["180deg", "540deg"],
                  }),
                },
                {
                  translateY: rotationAnim.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [80, 40, 0, 40, 80],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.bgCircle2, { opacity: 0.08 }]} />
        </Animated.View>

        {/* Compass Circle - Front (no background, compass icon with built-in circle) */}
        <View style={styles.compassCircleContainer}>
          <View style={styles.compassCircle}>
            {/* Compass Icon from MaterialCommunityIcons - Ant Design style */}
            <MaterialCommunityIcons
              name="compass-outline"
              size={120}
              color={PRIMARY_GREEN}
            />
          </View>
        </View>
      </View>

      {/* Get Started Button - Bottom */}
      <View style={{ width: "100%", marginTop: -30, marginBottom: 30 }}>
        <LoginButton onPress={handleGetStarted}>Let's Get Started</LoginButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    marginTop: 20,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  textBlock: {
    alignItems: "center",
    marginVertical: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  graphicContainer: {
    width: 380,
    height: 380,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginVertical: 30,
  },
  orbitContainer1: {
    position: "absolute",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  orbitContainer2: {
    position: "absolute",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  bgCircle1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: PRIMARY_BLUE,
    top: -70,
    left: "50%",
    marginLeft: -70,
  },
  bgCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: PRIMARY_GREEN,
    top: -70,
    left: "50%",
    marginLeft: -70,
  },
  trophyCircleContainer: {
    zIndex: 10,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  compassCircleContainer: {
    zIndex: 10,
  },
  compassCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
