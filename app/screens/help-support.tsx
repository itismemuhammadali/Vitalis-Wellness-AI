import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const FAQS = [
  {
    question: "What is KYVO?",
    answer: "KYVO is your personal growth companion. We use AI to help you define aspirations, generate daily goals, and visualize your 'Better Self' through a dynamic avatar that evolves with your progress."
  },
  {
    question: "How does the streak system work?",
    answer: "Your streak increases when you complete all your daily goals. If you miss a day, the streak resets to 1 on your next completion. Consistency is key to evolving your avatar!"
  },
  {
    question: "How is my avatar generated?",
    answer: "When you first join, we use your photo and aspirations to create an AI representation of your ideal self. As you complete goals and gain XP, your avatar level increases."
  },
  {
    question: "Can I change my aspirations?",
    answer: "Yes! You can update your aspirations in the 'Edit Profile' section of Settings. Note that changing major aspirations may trigger a refresh of your daily goals to align with your new direction."
  },
  {
    question: "Is my data private?",
    answer: "Absolutely. We encrypt your personal data and use industry-standard security. You can read our full Privacy Policy in the Settings menu."
  }
];

export default function HelpSupportScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const cardBg = isDarkMode ? "#1A1F2E" : "#FFFFFF";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";
  const textSecondary = isDarkMode ? "#B0B0B0" : "#757575";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";

  const handleContactSupport = () => {
    Linking.openURL('mailto:info@kyvoapp.com?subject=KYVO Support Request');
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: cardBg, borderColor: borderColor }]}
        >
          <Ionicons name="chevron-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimary }]}>Help & Support</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Support Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>Get in Touch</ThemedText>
          <TouchableOpacity onPress={handleContactSupport} activeOpacity={0.9}>
            <LinearGradient
              colors={["#1F9FFF", "#00D9A3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contactCard}
            >
              <MaterialCommunityIcons name="email-outline" size={32} color="#FFFFFF" />
              <View style={styles.contactInfo}>
                <ThemedText style={styles.contactTitle}>Email Support</ThemedText>
                <ThemedText style={styles.contactSubtitle}>info@kyvoapp.com</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FAQs Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>Frequently Asked Questions</ThemedText>
          {FAQS.map((faq, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => toggleFaq(index)}
              style={[styles.faqCard, { backgroundColor: cardBg, borderColor: borderColor }]}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <ThemedText style={[styles.faqQuestion, { color: textPrimary }]}>{faq.question}</ThemedText>
                <Ionicons 
                  name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={textSecondary} 
                />
              </View>
              {expandedFaq === index && (
                <ThemedText style={[styles.faqAnswer, { color: textSecondary }]}>
                  {faq.answer}
                </ThemedText>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            KYVO Version 1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#1F9FFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  contactSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  faqCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
