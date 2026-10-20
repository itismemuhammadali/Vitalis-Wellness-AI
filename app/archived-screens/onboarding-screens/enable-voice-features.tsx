import { usePermissions } from '@/context/PermissionsContext';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OnboardingHeader from '../../widgets/OnboardingHeader';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_BLUE = '#1CB0F6';
const PRIMARY_ORANGE = '#FF9500';
const DISABLED_BUTTON_COLOR = '#7A8A9A';
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

type MessageType = 'text' | 'audio' | 'video' | null;

export default function ChooseMessageTypeScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { requestCameraPermissionAsync, requestAudioPermissionAsync } = usePermissions();
  const [selectedType, setSelectedType] = useState<MessageType>(null);
  const [isPressed, setIsPressed] = useState(false);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  const buttonOpacity = isPressed ? 0.7 : 1;
  const currentButtonColor = selectedType ? PRIMARY_GREEN : DISABLED_BUTTON_COLOR;

  const messageTypes = [
    {
      id: 'text',
      label: 'Text Message',
      description: 'Write a message to your better self',
      icon: 'file-document-outline',
      color: PRIMARY_BLUE,
    },
    {
      id: 'audio',
      label: 'Voice Message',
      description: 'Record your voice to your better self',
      icon: 'microphone',
      color: PRIMARY_ORANGE,
    },
    {
      id: 'video',
      label: 'Video Message',
      description: 'Record a video message to your better self',
      icon: 'video',
      color: PRIMARY_GREEN,
    },
  ];

  const handleContinue = async () => {
    if (!selectedType) return;

    try {
      // Request permissions only for the selected type
      if (selectedType === 'audio') {
        const audioGranted = await requestAudioPermissionAsync();
        if (!audioGranted) {
          console.warn('Audio permission denied');
          return;
        }
      } else if (selectedType === 'video') {
        const cameraGranted = await requestCameraPermissionAsync();
        if (!cameraGranted) {
          console.warn('Camera permission denied');
          return;
        }
      }

      // Navigate to time capsule with selected type
      router.push({
        pathname: '/screens/onboarding/time-capsule',
        params: { messageType: selectedType },
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Onboarding Header with Progress */}
        <OnboardingHeader currentStep={6} totalSteps={7} onBack={() => router.push('/screens/onboarding/sign-commitment')} />

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>Choose Your Message Type</Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          How would you like to send a message to your better self?
        </Text>

        {/* Message Type Options */}
        <View style={styles.optionsContainer}>
          {messageTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: cardBg,
                  borderColor: selectedType === type.id ? type.color : borderColor,
                  borderWidth: selectedType === type.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedType(type.id as MessageType)}
            >
              <View style={styles.optionContent}>
                <View style={[styles.iconCircle, { backgroundColor: `${type.color}20` }]}>
                  <MaterialCommunityIcons name={type.icon as any} size={32} color={type.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: textColor }]}>{type.label}</Text>
                  <Text style={[styles.optionDescription, { color: subtitleColor }]}>
                    {type.description}
                  </Text>
                </View>
              </View>
              {selectedType === type.id && (
                <View style={[styles.checkmark, { backgroundColor: type.color }]}>
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: currentButtonColor,
              opacity: buttonOpacity,
            },
          ]}
          onPress={handleContinue}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={!selectedType}
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
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
