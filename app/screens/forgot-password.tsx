import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ForgotPasswordScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [email, setEmail] = useState('user_1');
  
  const screenTitle = mode === 'change' ? 'Change Password' : 'Forgot Password';

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const inputBg = isDarkMode ? '#0F1419' : '#F5F1E8';

  const isFormValid = email.trim();

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.backButton, { color: textPrimary }]}>
              ←
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: textPrimary }]}>
            {screenTitle}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: borderColor,
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.heading, { color: textPrimary }]}>
            Enter Your Email
          </ThemedText>
          <ThemedText style={[styles.description, { color: textSecondary }]}>
            We'll send a password reset link to this email address.
          </ThemedText>

          {/* Email Input */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: textPrimary }]}>
              Email Address
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  color: textPrimary,
                  borderColor: borderColor,
                },
              ]}
              placeholder="user_1"
              placeholderTextColor={textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor: isFormValid ? '#58CC02' : '#4A9A00',
                opacity: isFormValid ? 1 : 0.6,
              },
            ]}
            disabled={!isFormValid}
          >
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Verify Email
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                borderColor: '#58CC02',
              },
            ]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.cancelButtonText, { color: '#58CC02' }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    fontSize: 36,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  content: {
    marginBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
