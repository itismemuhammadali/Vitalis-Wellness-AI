import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import OnboardingButton from '../../components/OnboardingButton';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_ORANGE = '#FF9500';
const CATEGORY_BLUE = '#1CB0F6';
const CATEGORY_PURPLE = '#CE82FF';
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

const aspirationCategories = [
  {
    id: 1,
    name: 'Financial',
    icon: '💰',
    color: PRIMARY_GREEN,
    questions: [
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
    ],
  },
  {
    id: 2,
    name: 'Health & Fitness',
    icon: '💪',
    color: PRIMARY_ORANGE,
    questions: [
      {
        id: 'weight',
        label: 'How much would you like to weigh?',
        placeholder: 'e.g., 180 lbs',
        unit: 'lbs',
      },
      {
        id: 'body_fat',
        label: 'What body fat percentage would you like?',
        placeholder: 'e.g., 15%',
        unit: '%',
      },
      {
        id: 'fitness_level',
        label: 'Describe your ideal fitness level',
        placeholder: 'e.g., Run a 5K, lift 225 lbs',
        unit: '',
      },
    ],
  },
  {
    id: 3,
    name: 'Career & Skills',
    icon: '📈',
    color: CATEGORY_BLUE,
    questions: [
      {
        id: 'job_title',
        label: 'What job title or role would you like?',
        placeholder: 'e.g., Senior Manager',
        unit: '',
      },
      {
        id: 'skills',
        label: 'What key skills would you like to master?',
        placeholder: 'e.g., Leadership, Python, Public Speaking',
        unit: '',
      },
    ],
  },
  {
    id: 4,
    name: 'Personal & Lifestyle',
    icon: '🌟',
    color: CATEGORY_PURPLE,
    questions: [
      {
        id: 'daily_habits',
        label: 'What daily habits would your better self have?',
        placeholder: 'e.g., Meditate 20 min, Read 1 hour, Exercise',
        unit: '',
      },
      {
        id: 'relationships',
        label: 'How would you describe your ideal relationships?',
        placeholder: 'e.g., Deep connections, supportive circle',
        unit: '',
      },
    ],
  },
];

export default function SetGoalsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [aspirations, setAspirations] = useState<Map<string, string>>(new Map());

  const updateAspiration = (questionId: string, value: string) => {
    const newAspirations = new Map(aspirations);
    newAspirations.set(questionId, value);
    setAspirations(newAspirations);
  };

  const handleCreateCustomAspiration = () => {
    router.push('/screens/onboarding/create-custom-goal');
  };

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;

  const toggleCategory = (categoryId: number) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleContinue = () => {
    router.push('/screens/onboarding/sign-commitment');
  };

  // Check if at least one aspiration is filled
  const hasAspirations = aspirations.size > 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Onboarding Header with Progress */}
        <OnboardingHeader currentStep={3} totalSteps={6} onBack={() => router.push('/screens/onboarding/potential')} />

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>Describe Your Better Self</Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Paint a picture of the powerful version of yourself. This becomes your adviser.
        </Text>

        {/* Create Custom Aspiration Button */}
        <TouchableOpacity style={[styles.customButton, { borderColor: PRIMARY_ORANGE }]} onPress={handleCreateCustomAspiration}>
          <MaterialCommunityIcons name="plus" size={24} color={PRIMARY_ORANGE} />
          <Text style={[styles.customButtonText, { color: PRIMARY_ORANGE }]}>
            Add Custom Aspiration
          </Text>
        </TouchableOpacity>

        {/* Aspiration Categories */}
        <View style={styles.categoriesContainer}>
          {aspirationCategories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            // Check if any question in this category has been answered
            const hasAnsweredQuestions = category.questions.some(q => aspirations.get(q.id));
            const activeBorderColor = hasAnsweredQuestions ? category.color : borderColor;

            return (
              <View
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    borderColor: activeBorderColor,
                    borderWidth: isExpanded ? 2 : 1,
                    backgroundColor: cardBg,
                  },
                ]}
              >
                {/* Category Header */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: hasAnsweredQuestions ? category.color : textColor }]}>
                        {category.name}
                      </Text>
                    </View>
                  </View>

                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={hasAnsweredQuestions ? category.color : subtitleColor}
                  />
                </TouchableOpacity>

                {/* Expanded Questions */}
                {isExpanded && (
                  <View style={[styles.questionsContainer, { borderColor: activeBorderColor }]}>
                    {category.questions.map((question, index) => {
                      const value = aspirations.get(question.id) || '';
                      const isLastQuestion = index === category.questions.length - 1;

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
                                  borderColor: value ? category.color : borderColor,
                                },
                              ]}
                              placeholder={question.placeholder}
                              placeholderTextColor={subtitleColor}
                              value={value}
                              onChangeText={(text: string) => updateAspiration(question.id, text)}
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
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <OnboardingButton
          onPress={handleContinue}
          disabled={!hasAspirations}
          buttonColor="#1CB0F6"
          disabledColor="#7A8A9A"
          shadowColor="#1CB0F6"
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
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 24,
    gap: 8,
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    gap: 16,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 13,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
