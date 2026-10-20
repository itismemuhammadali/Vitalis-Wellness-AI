import { usePostOnboarding } from '@/context/PostOnboardingContext';
import { useTheme } from '@/context/ThemeContext';
import { profileQuestionService } from '@/services/profileQuestionService';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TOTAL_QUESTIONS = 11;
const CURRENT_QUESTION = 11;

const options = [
  { id: '1', text: 'Strong family and friends' },
  { id: '2', text: 'Close friends only' },
  { id: '3', text: 'Professional support (therapist, coach)' },
  { id: '4', text: 'Online community' },
  { id: '5', text: 'I feel isolated' },
  { id: '6', text: 'Mix of different support types' },
];

export default function Question11Screen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { navigationSource } = usePostOnboarding();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const cardBg = isDarkMode ? '#1A2332' : '#FFFFFF';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const progressColor = '#7FFF00';

  const handleNext = async () => {
    if (selectedOption) {
      await profileQuestionService.markProfileQuestionsCompleted();
      router.push('/screens/post-onboarding/summary');
    }
  };

  const handleBack = () => {
    router.push('/screens/post-onboarding/question-10');
  };

  const handleExitBack = () => {
    if (navigationSource === 'profile') {
      router.push('/screens/profile');
    } else {
      router.push('/screens/home');
    }
  };

  const handleSkip = async () => {
    await profileQuestionService.markProfileQuestionsCompleted();
    router.push('/screens/post-onboarding/summary');
  };

  const progress = (CURRENT_QUESTION / TOTAL_QUESTIONS) * 100;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: progressColor }]}
          onPress={handleExitBack}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={progressColor} />
        </TouchableOpacity>
        <Text style={[styles.progressText, { color: progressColor }]}>
          {CURRENT_QUESTION}/{TOTAL_QUESTIONS}
        </Text>
      </View>

      <View style={[styles.progressBarContainer, { backgroundColor: borderColor }]}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: textPrimary }]}>What's your support system like?</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>Who supports you?</Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: cardBg,
                  borderColor: selectedOption === option.id ? progressColor : borderColor,
                  borderWidth: selectedOption === option.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedOption(option.id)}
            >
              <View
                style={[
                  styles.radioButton,
                  {
                    borderColor: selectedOption === option.id ? progressColor : borderColor,
                    backgroundColor: selectedOption === option.id ? progressColor : 'transparent',
                  },
                ]}
              >
                {selectedOption === option.id && (
                  <MaterialCommunityIcons name="check" size={16} color="#000000" />
                )}
              </View>
              <Text style={[styles.optionText, { color: textPrimary }]}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.backButtonBottom,
              {
                borderColor: progressColor,
                borderWidth: 2,
              },
            ]}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, { color: progressColor }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor: selectedOption ? progressColor : '#4A5568',
              },
            ]}
            onPress={handleNext}
            disabled={!selectedOption}
          >
            <Text
              style={[
                styles.nextButtonText,
                {
                  color: selectedOption ? '#000000' : '#808080',
                },
              ]}
            >
              Complete
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: textSecondary }]}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    marginTop: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: { fontSize: 18, fontWeight: '700' },
  progressBarContainer: {
    height: 8,
    marginHorizontal: 16,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, lineHeight: 36 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  optionsContainer: { gap: 12 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  optionText: { fontSize: 16, fontWeight: '500', flex: 1 },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 12,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonBottom: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: { fontSize: 16, fontWeight: '600' },
  skipText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
