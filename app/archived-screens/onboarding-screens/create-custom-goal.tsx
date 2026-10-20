import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_ORANGE = '#FF9500';
const DARK_BG = '#0F1419';
const LIGHT_BG = '#F5F1E8';
const DARK_TEXT = '#FFFFFF';
const LIGHT_TEXT = '#1F1F1F';
const DARK_SUBTITLE = '#B0B0B0';
const LIGHT_SUBTITLE = '#757575';
const DARK_INPUT_BG = '#1A2332';
const LIGHT_INPUT_BG = '#FFFFFF';
const DARK_BORDER = '#2A3A4A';
const LIGHT_BORDER = '#E0E0E0';

interface CustomGoal {
  id: string;
  title: string;
  description: string;
}

export default function CreateCustomGoalScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string;
  const categoryColor = params.categoryColor as string || PRIMARY_GREEN;
  const [isPressed, setIsPressed] = useState(false);

  const [aspirations, setAspirations] = useState<CustomGoal[]>([
    { id: '1', title: '', description: '' },
  ]);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  const buttonOpacity = isPressed ? 0.7 : 1;

  const handleAddGoal = () => {
    const newId = (Math.max(...aspirations.map(g => parseInt(g.id)), 0) + 1).toString();
    setAspirations([...aspirations, { id: newId, title: '', description: '' }]);
  };

  const handleRemoveGoal = (id: string) => {
    if (aspirations.length > 1) {
      setAspirations(aspirations.filter(g => g.id !== id));
    }
  };

  const handleUpdateGoal = (id: string, field: 'title' | 'description', value: string) => {
    setAspirations(aspirations.map(g => 
      g.id === id ? { ...g, [field]: value } : g
    ));
  };

  const handleContinue = () => {
    // Filter out empty aspirations and pass them back
    const validAspirations = aspirations.filter(g => g.title.trim().length > 0).map((g, index) => ({
      id: `custom-${Date.now()}-${index}`,
      title: g.title,
      description: g.description,
    }));
    
    if (validAspirations.length > 0) {
      // Pass the custom aspirations back to set-goals screen
      router.push({
        pathname: '/screens/onboarding/set-goals',
        params: {
          customGoals: JSON.stringify(validAspirations),
          categoryId: categoryId,
        },
      });
    } else {
      // If no valid aspirations, just go back
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Onboarding Header with Progress */}
        <OnboardingHeader currentStep={3} totalSteps={6} onBack={() => router.push('/screens/onboarding/set-goals')} />

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>Add Custom Aspiration</Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Define another metric or characteristic of your better self. What else matters to you?
        </Text>

        {/* Aspirations List */}
        <View style={styles.goalsContainer}>
          {aspirations.map((aspiration, index) => (
            <View key={aspiration.id} style={styles.goalSet}>
              {/* Aspiration Number */}
              <Text style={[styles.goalNumber, { color: subtitleColor }]}>
                Aspiration {index + 1}
              </Text>

              {/* Title Input */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: textColor }]}>What aspect of your better self? *</Text>
                <View style={[styles.inputWrapper, { borderColor: categoryColor }]}>
                  <MaterialCommunityIcons name="star" size={20} color={categoryColor} />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: textColor,
                      },
                    ]}
                    placeholder="e.g., Speak 3 languages, Run a marathon"
                    placeholderTextColor={subtitleColor}
                    value={aspiration.title}
                    onChangeText={(text) => handleUpdateGoal(aspiration.id, 'title', text)}
                  />
                </View>
              </View>

              {/* Description Input */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: textColor }]}>Why is this important? (Optional)</Text>
                <View style={[styles.inputWrapper, { borderColor: borderColor }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={subtitleColor} />
                  <TextInput
                    style={[
                      styles.descriptionInput,
                      {
                        color: textColor,
                      },
                    ]}
                    placeholder="e.g., Opens doors to new opportunities and experiences"
                    placeholderTextColor={subtitleColor}
                    value={aspiration.description}
                    onChangeText={(text) => handleUpdateGoal(aspiration.id, 'description', text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Remove Button - Only show if more than 1 aspiration */}
              {aspirations.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveGoal(aspiration.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF6B6B" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              {index < aspirations.length - 1 && (
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
              )}
            </View>
          ))}
        </View>

        {/* Add Aspiration Button */}
        <TouchableOpacity
          style={[styles.addButton, { borderColor: PRIMARY_ORANGE }]}
          onPress={handleAddGoal}
        >
          <MaterialCommunityIcons name="plus" size={24} color={PRIMARY_ORANGE} />
          <Text style={[styles.addButtonText, { color: PRIMARY_ORANGE }]}>Add Another Aspiration</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: PRIMARY_GREEN,
              opacity: buttonOpacity,
            },
          ]}
          onPress={handleContinue}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={1}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
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
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  goalsContainer: {
    marginBottom: 24,
  },
  goalSet: {
    marginBottom: 24,
  },
  goalNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  addButton: {
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
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
