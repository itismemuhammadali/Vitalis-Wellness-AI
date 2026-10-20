import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_BLUE = '#1F76D2';
const PRIMARY_ORANGE = '#FF9500';
const DARK_BG = '#0F1419';
const LIGHT_BG = '#F5F1E8';
const DARK_TEXT = '#FFFFFF';
const LIGHT_TEXT = '#1F1F1F';
const DARK_SUBTITLE = '#B0B0B0';
const LIGHT_SUBTITLE = '#757575';
const CARD_BG = '#3A4A5A';
const BLUE_COLOR = PRIMARY_BLUE;
const ORANGE_COLOR = PRIMARY_ORANGE;

// Button style constants (reusable across all screens)
const BUTTON_BORDER_RADIUS = 24;
const BUTTON_PADDING_VERTICAL = 18;
const BUTTON_SHADOW_OFFSET = { width: 0, height: 8 };
const BUTTON_SHADOW_OPACITY = 0.5;
const BUTTON_SHADOW_RADIUS = 12;
const BUTTON_ELEVATION = 12;

export default function PotentialScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [popAnim] = useState(new Animated.Value(0));
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(popAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
    ]).start();
  }, [popAnim]);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;

  const handleStartJourney = () => {
    router.push('/screens/onboarding/set-goals');
  };

  const buttonOpacity = isPressed ? 0.7 : 1;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Onboarding Header with Progress */}
        <OnboardingHeader currentStep={2} totalSteps={6} onBack={() => router.push('/screens/onboarding/notification-permission')} />

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>
          Become the better version of yourself
        </Text>
        <Text style={[styles.titleHighlight]}>with KYVO</Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Clear direction. Ongoing guidance. Real progress.
        </Text>

        {/* Growth Graph */}
        <View style={styles.graphContainer}>
          <Svg width="100%" height={240} viewBox="0 0 300 240">
            {/* Bottom grid line only */}
            <Path
              d="M 20 200 L 280 200"
              stroke={subtitleColor}
              strokeWidth="1"
              opacity="0.3"
            />
            
            {/* True S-curve - bottom curve up, top curve levels off */}
            <Path
              d="M 20 200 C 40 198, 60 190, 90 160 C 120 130, 150 100, 200 60 C 240 30, 260 20, 280 20"
              stroke={PRIMARY_GREEN}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Start point dot */}
            <Circle cx="20" cy="200" r="6" fill={PRIMARY_GREEN} />

            {/* End point dot */}
            <Circle cx="280" cy="20" r="6" fill={PRIMARY_GREEN} />
          </Svg>

          {/* Labels */}
          <View style={styles.graphLabels}>
            <Text style={[styles.graphLabel, { color: subtitleColor }]}>Before</Text>
            <Text style={[styles.graphLabel, { color: subtitleColor }]}>After</Text>
          </View>
        </View>


        {/* Start your journey Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: ORANGE_COLOR, opacity: buttonOpacity }]}
            onPress={handleStartJourney}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            activeOpacity={1}
          >
            <Text style={styles.startButtonText}>Start your journey</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.disclaimer, { color: subtitleColor }]}>
          This result is an indication only, not a medical diagnosis
        </Text>
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
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 44,
    textAlign: 'center',
  },
  titleHighlight: {
    fontSize: 36,
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  percentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  bottomText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  graphContainer: {
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: -10,
  },
  graphLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
    marginTop: 30,
  },
  startButton: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
