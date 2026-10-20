import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import OnboardingButton from '../../components/OnboardingButton';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
const DARK_BG = '#0F1419';
const LIGHT_BG = '#F5F1E8';
const DARK_TEXT = '#FFFFFF';
const LIGHT_TEXT = '#1F1F1F';
const DARK_SUBTITLE = '#B0B0B0';
const LIGHT_SUBTITLE = '#757575';

export default function SignCommitmentScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const svgRef = useRef<any>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    const x = touch.locationX;
    const y = touch.locationY;
    setCurrentPath(`M ${x} ${y}`);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: any) => {
    if (!isDrawing) return;
    const touch = e.nativeEvent.touches[0];
    const x = touch.locationX;
    const y = touch.locationY;
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths([...paths, currentPath]);
    }
    setCurrentPath('');
    setIsDrawing(false);
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const handleContinue = () => {
    router.push('/screens/onboarding/time-capsule');
  };

  const isSignatureEmpty = paths.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.topSection}>
        <View style={[styles.header, { marginTop: 30 }]}>
          <OnboardingHeader currentStep={4} totalSteps={6} onBack={() => router.push('/screens/onboarding/set-goals')} />
          <Text style={[styles.title, { color: textColor }]}>Sign your commitment</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            I commit to showing up as the person I want to become.
          </Text>
        </View>

        <View
          style={styles.canvasWrapper}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Svg width="100%" height="100%" ref={svgRef}>
            <Path d={paths.join(' ')} stroke="#1F1F1F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={currentPath} stroke="#1F1F1F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>

        <Text style={[styles.canvasHint, { color: subtitleColor }]}>
          Draw on the open space above
        </Text>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
        >
          <MaterialCommunityIcons name="eraser" size={18} color={PRIMARY_GREEN} />
          <Text style={[styles.clearButtonText, { color: PRIMARY_GREEN }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <OnboardingButton
          onPress={handleContinue}
          buttonColor={PRIMARY_GREEN}
          disabledColor="#7A8A9A"
          shadowColor={PRIMARY_GREEN}
          disabledShadowColor="#7A8A9A"
          disabled={isSignatureEmpty}
        >
          Continue
        </OnboardingButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'column',
  },
  topSection: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  canvasWrapper: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  canvasHint: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
