import { useAuth } from '@/app/context/AuthContext';
import SuccessConfirmationPopup from '@/app/widgets/SuccessConfirmationPopup';
import { useTheme } from '@/context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import PressableButton from '../../components/PressableButton';

const PRIMARY_GREEN = '#58CC02';
const DARK_BG = '#0F1419';
const LIGHT_BG = '#F5F1E8';
const DARK_INPUT_BG = '#1A1F2E';
const LIGHT_INPUT_BG = '#FFFFFF';
const DARK_INPUT_BORDER = '#2A3142';
const LIGHT_INPUT_BORDER = '#E0E0E0';
const DARK_TEXT = '#1F1F1F';
const LIGHT_TEXT = '#FFFFFF';
const DARK_SUBTITLE = '#757575';
const LIGHT_SUBTITLE = '#B0B0B0';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { resetPassword, loading } = useAuth();
  const params = useLocalSearchParams();
  const mode = (params?.mode as string) || 'forgot'; // 'forgot' or 'change'
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const headerTitle = mode === 'change' ? 'Change Password' : 'Forgot Password';

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? LIGHT_TEXT : DARK_TEXT;
  const inputBgColor = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const inputBorderColor = isDarkMode ? DARK_INPUT_BORDER : LIGHT_INPUT_BORDER;
  const subtitleColor = isDarkMode ? LIGHT_SUBTITLE : DARK_SUBTITLE;
  const iconColor = isDarkMode ? LIGHT_TEXT : DARK_TEXT;

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    try {
      await resetPassword(email);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setStep('reset');
        setShowSuccessPopup(false);
      }, 2000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      {step === 'email' ? (
        <>
          {/* Email Step */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: textColor }]}>Enter Your Email</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>We'll send a password reset link to this email address.</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: textColor }]}>Email Address</Text>
            <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}>
              <SimpleLineIcons name="envelope" size={20} color={iconColor} style={styles.iconMargin} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter your email"
                placeholderTextColor={subtitleColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.buttonSection}>
            <PressableButton
              onPress={handleVerifyEmail}
              disabled={loading}
              buttonColor={PRIMARY_GREEN}
              disabledColor="#7A8A9A"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </PressableButton>

            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: PRIMARY_GREEN }]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: PRIMARY_GREEN }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Reset Link Step */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: textColor }]}>Send Reset Link</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>Click the button below to send a password reset link to your email.</Text>
          </View>

          <View style={styles.emailBox}>
            <View style={[styles.emailContent, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}>
              <SimpleLineIcons name="envelope" size={24} color={PRIMARY_GREEN} style={styles.emailIcon} />
              <View>
                <Text style={[styles.emailLabel, { color: subtitleColor }]}>Reset link will be sent to</Text>
                <Text style={[styles.emailAddress, { color: textColor }]}>{email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonSection}>
            <PressableButton
              onPress={() => {
                Alert.alert('Success', 'Reset link sent to ' + email);
                router.back();
              }}
              buttonColor={PRIMARY_GREEN}
              disabledColor="#7A8A9A"
            >
              Send Reset Link
            </PressableButton>

            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: PRIMARY_GREEN }]}
              onPress={() => setStep('email')}
            >
              <Text style={[styles.secondaryButtonText, { color: PRIMARY_GREEN }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Success Popup */}
      <SuccessConfirmationPopup
        visible={showSuccessPopup}
        message="✅ Reset link sent to your email!"
        isDarkMode={isDarkMode}
        onDismiss={() => setShowSuccessPopup(false)}
        duration={2000}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3142',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
  },
  iconMargin: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 16,
  },
  emailBox: {
    marginBottom: 30,
  },
  emailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
  },
  emailIcon: {
    marginRight: 15,
  },
  emailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
