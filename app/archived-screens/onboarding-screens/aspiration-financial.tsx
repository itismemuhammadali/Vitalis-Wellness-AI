import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import OnboardingButton from '../../components/OnboardingButton';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
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
const DARK_INPUT_BG = '#0F1419';
const LIGHT_INPUT_BG = '#F5F1E8';

const questions = [
  {
    id: 'bank_account',
    label: 'How much money would you like to have in your bank account?',
    placeholder: 'e.g., $50,000',
    unit: '$',
  },
  {
    id: 'annual_income',
    label: 'What annual income would you like to earn?',
    placeholder: 'e.g., $100,000',
    unit: '$',
  },
];

export default function AspirationFinancialScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());

  const updateAnswer = (questionId: string, value: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, value);
    setAnswers(newAnswers);
  };

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;

  const handleContinue = () => {
    router.push('/screens/onboarding/aspiration-health');
  };

  const hasAnswers = answers.size > 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <OnboardingHeader currentStep={3} totalSteps={9} onBack={() => router.push('/screens/onboarding/notification-permission')} />

        <Text style={[styles.icon]}>💰</Text>
        <Text style={[styles.title, { color: textColor }]}>Financial Aspirations</Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          What are your financial goals?
        </Text>

        <View style={styles.questionsContainer}>
          {questions.map((question, index) => {
            const value = answers.get(question.id) || '';
            const isLastQuestion = index === questions.length - 1;

            return (
              <View
                key={question.id}
                style={[
                  styles.questionItem,
                  !isLastQuestion && { borderBottomWidth: 1, borderBottomColor: borderColor },
                ]}
              >
                <Text style={[styles.questionLabel, { color: textColor }]}>
                  {question.label}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        color: textColor,
                        borderColor: value ? PRIMARY_GREEN : borderColor,
                      },
                    ]}
                    placeholder={question.placeholder}
                    placeholderTextColor={subtitleColor}
                    value={value}
                    onChangeText={(text: string) => updateAnswer(question.id, text)}
                  />
                  {question.unit && (
                    <Text style={[styles.unitLabel, { color: subtitleColor }]}>
                      {question.unit}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          onPress={handleContinue}
          disabled={!hasAnswers}
          buttonColor={PRIMARY_GREEN}
          disabledColor="#7A8A9A"
          shadowColor={PRIMARY_GREEN}
          disabledShadowColor="#7A8A9A"
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
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 100,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  questionsContainer: {
    gap: 0,
  },
  questionItem: {
    paddingVertical: 16,
    gap: 8,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  unitLabel: {
    position: 'absolute',
    right: 14,
    top: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
