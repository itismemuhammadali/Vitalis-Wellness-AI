import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OnboardingButton from '../../components/OnboardingButton';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
const DARK_BG = '#0F1419';
const LIGHT_BG = '#F5F1E8';
const DARK_TEXT = '#FFFFFF';
const LIGHT_TEXT = '#1F1F1F';
const DARK_SUBTITLE = '#B0B0B0';
const LIGHT_SUBTITLE = '#757575';
const BORDER_COLOR = '#2A3A4A';
const DISABLED_BUTTON_COLOR = '#7A8A9A';

const genderOptions = [
  { id: 1, label: 'Male', icon: 'male' },
  { id: 2, label: 'Female', icon: 'female' },
  { id: 3, label: 'Non-binary', icon: 'gender-non-binary' },
  { id: 4, label: 'Prefer not to say', icon: 'help-circle' },
];

export default function GenderSelectionScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [selectedGender, setSelectedGender] = useState<number | null>(null);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;

  const handleContinue = () => {
    if (selectedGender) {
      router.push('/screens/onboarding/notification-permission');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <OnboardingHeader currentStep={1} totalSteps={8} onBack={() => router.push('/screens/onboarding/welcome')} />

        <Text style={[styles.title, { color: textColor }]}>What's your biological gender?</Text>

        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  borderColor: selectedGender === option.id ? PRIMARY_GREEN : BORDER_COLOR,
                  borderWidth: selectedGender === option.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedGender(option.id)}
            >
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: selectedGender === option.id ? PRIMARY_GREEN : BORDER_COLOR,
                  },
                ]}
              >
                {selectedGender === option.id && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: PRIMARY_GREEN,
                    }}
                  />
                )}
              </View>
              <Text style={[styles.optionLabel, { color: textColor }]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          onPress={handleContinue}
          disabled={!selectedGender}
          buttonColor={PRIMARY_GREEN}
          disabledColor={DISABLED_BUTTON_COLOR}
          shadowColor={PRIMARY_GREEN}
          disabledShadowColor={DISABLED_BUTTON_COLOR}
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
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    lineHeight: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
