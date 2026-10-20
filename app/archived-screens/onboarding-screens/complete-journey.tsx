import { useTheme } from '@/context/ThemeContext';
import { profileQuestionService } from '@/services/profileQuestionService';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_ORANGE = '#FF9500';
const DARK_BG = '#0F1419';
const LIGHT_BG = '#F5F1E8';
const DARK_TEXT = '#FFFFFF';
const LIGHT_TEXT = '#1F1F1F';
const DARK_SUBTITLE = '#B0B0B0';
const LIGHT_SUBTITLE = '#757575';
const DARK_CARD_BG = '#1A2332';
const LIGHT_CARD_BG = '#FFFFFF';
const DARK_BORDER = '#2A3A4A';
const LIGHT_BORDER = '#E0E0E0';

export default function CompleteJourneyScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [isPressed, setIsPressed] = React.useState(false);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  const buttonOpacity = isPressed ? 0.7 : 1;

  const handleStartTransformation = async () => {
    // Mark onboarding as completed
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    // Reset profile question state to show popup on home screen
    await profileQuestionService.resetProfileQuestion();
    router.push('/screens/home');
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: subtitleColor }]}>
            <MaterialCommunityIcons name="account" size={40} color={bgColor} />
          </View>
        </View>

        {/* Main Heading */}
        <Text style={[styles.mainHeading, { color: textColor }]}>
          The system will help you become the best version of yourself in less than 90 days.
        </Text>

        {/* Goal Box */}
        <View style={[styles.goalBox, { borderColor: PRIMARY_GREEN }]}>
          <Text style={[styles.goalBoxText, { color: PRIMARY_GREEN }]}>
            Become the best version of yourself by: May 31, 2026
          </Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="check-circle" size={24} color={PRIMARY_GREEN} />
            <Text style={[styles.benefitText, { color: textColor }]}>Build discipline that actually sticks</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="check-circle" size={24} color={PRIMARY_GREEN} />
            <Text style={[styles.benefitText, { color: textColor }]}>Follow a clear plan instead of guessing</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="check-circle" size={24} color={PRIMARY_GREEN} />
            <Text style={[styles.benefitText, { color: textColor }]}>Feel focused, energized, and in control</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={styles.star}>★</Text>
            ))}
          </View>
          <Text style={[styles.ratingText, { color: textColor }]}>4.9</Text>
        </View>

        {/* How to Reach Goals */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>How to reach your goals</Text>

        {/* Feature Cards */}
        <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.featureIconContainer}>
            <View style={styles.redCircle}>
              <MaterialCommunityIcons name="target" size={24} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.featureText, { color: textColor }]}>Smart goal setting and tracking</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.featureIconContainer}>
            <View style={styles.pinkBrain}>
              <MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.featureText, { color: textColor }]}>Build an aligned & confident mindset</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.featureIconContainer}>
            <View style={styles.beigeFolder}>
              <MaterialCommunityIcons name="folder" size={24} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.featureText, { color: textColor }]}>A simple daily action plan</Text>
        </View>

        {/* Journey Text */}
        <Text style={[styles.journeyText, { color: subtitleColor }]}>You've come this far...</Text>

        {/* Final Heading */}
        <Text style={[styles.finalHeading, { color: textColor }]}>
          Complete your journey for less.
        </Text>

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: PRIMARY_ORANGE, opacity: buttonOpacity }]}
            onPress={handleStartTransformation}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            activeOpacity={1}
          >
            <Text style={styles.startButtonText}>Start My Transformation</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: subtitleColor }]}>Terms</Text>
          </TouchableOpacity>
          <Text style={[styles.footerDot, { color: subtitleColor }]}>•</Text>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: subtitleColor }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.footerDot, { color: subtitleColor }]}>•</Text>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: subtitleColor }]}>Restore</Text>
          </TouchableOpacity>
        </View>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 36,
  },
  goalBox: {
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  goalBoxText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  benefitsList: {
    marginBottom: 32,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 24,
    color: '#FFB800',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinkBrain: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E89BB5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beigeFolder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4A574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  journeyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 8,
  },
  finalHeading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 40,
  },
  buttonContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  startButton: {
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 12,
  },
});
