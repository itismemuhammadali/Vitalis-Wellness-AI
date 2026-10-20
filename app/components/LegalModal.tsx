import { useTheme } from "@/context/ThemeContext";
import React from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const PRIMARY_GREEN = "#58CC02";

export const TERMS_TEXT = `Terms & Conditions
Effective Date: April 30, 2026

Welcome to Kyvo. These Terms & Conditions govern your access to and use of the Kyvo application, website, and related services (collectively, the “Service”). By accessing or using the Service, you agree to be bound by these Terms.

If you do not agree, you must not use the Service.

1. Eligibility
You must be at least 18 years old to use the Service. By using Kyvo, you represent and warrant that you meet this requirement and have the legal capacity to enter into a binding agreement.

2. Description of the Service
Kyvo is a self-improvement platform that allows users to track goals, habits, routines, and personal development. The Service includes AI-powered features such as avatar generation and personalized guidance based on user input, including images.
Kyvo does not guarantee specific results or outcomes.

3. User Accounts
To access certain features, you may be required to create an account. You agree to:
• Provide accurate, current, and complete information
• Maintain the confidentiality of your login credentials
• Be responsible for all activity under your account
We reserve the right to suspend or terminate accounts that violate these Terms.

4. Acceptable Use
You agree not to:
• Use the Service for unlawful purposes
• Attempt to gain unauthorized access to systems or data
• Interfere with the performance or integrity of the Service
• Upload malicious code or harmful content
• Use the Service in a way that harms other users or the platform

5. Subscriptions & Payments
Certain features require payment. By subscribing, you agree:
• Fees are billed in advance on a recurring basis unless canceled
• You authorize the applicable app store or payment processor to charge your payment method
• All payments are non-refundable except where required by law
• You are responsible for managing and canceling subscriptions
Pricing may change with reasonable notice.

6. User Content
You retain ownership of content you submit, including images, text, and personal inputs.
You grant Kyvo a limited, non-exclusive, worldwide license to use your content solely to provide and improve the Service.
You agree not to submit content that is illegal, harmful, misleading, or infringing on third-party rights.

7. Intellectual Property
All rights in the Service, including software, design, trademarks, and content, are owned by or licensed to Kyvo. You may not copy, distribute, modify, or reverse engineer any part of the Service without permission.

8. AI-Generated Content
Kyvo uses artificial intelligence to generate outputs, including avatars and recommendations. You acknowledge:
• Outputs are generated algorithmically and may not reflect real-world outcomes
• Results are not guaranteed
• You are responsible for how you use generated content

9. No Professional Advice
The Service is for informational and personal development purposes only and does not constitute medical, psychological, financial, or legal advice.

10. Service Availability
We do not guarantee uninterrupted or error-free operation. We may modify, suspend, or discontinue the Service at any time.

11. Termination
We may suspend or terminate your access if you violate these Terms or if required by law. You may stop using the Service at any time.

12. Disclaimers
The Service is provided “as is” and “as available,” without warranties of any kind.

13. Limitation of Liability
To the maximum extent permitted by law, Kyvo shall not be liable for indirect, incidental, or consequential damages, including loss of data, profits, or opportunities.

14. Indemnification
You agree to indemnify and hold harmless Kyvo from any claims or liabilities arising from your use of the Service or violation of these Terms.

15. Changes to Terms
We may update these Terms at any time. Continued use of the Service constitutes acceptance of the updated Terms.

16. Governing Law
These Terms are governed by the laws of the State of Wyoming, except where mandatory laws of your jurisdiction apply.

17. Contact
info@kyvoapp.com`;

export const PRIVACY_TEXT = `Privacy Policy
Effective Date: April 30, 2026

This Privacy Policy explains how Kyvo collects, uses, processes, and protects your information when you use the Service. By using Kyvo, you agree to the collection and use of information in accordance with this Policy.

1. Information We Collect
a. Information You Provide
• Name, email, and account details
• Photos and images you upload
• Goals, prompts, and personal inputs

b. Biometric and Image Data
Kyvo may collect and process biometric information derived from facial images, including facial geometry, for the purpose of generating AI-based avatars and visual representations.

c. Automatically Collected Data
• Device information
• Usage data
• Log data
• IP address and approximate location

2. How We Use Your Information
We use your information to:
• Provide and operate the Service
• Generate AI avatars and personalized outputs
• Improve performance and features
• Process subscriptions and transactions
• Ensure security and prevent abuse

3. Biometric Data Use and Consent
By uploading a photo, you provide explicit consent to process biometric data for avatar generation.
Biometric data:
• Is used only for the stated purpose
• Is not sold
• Is retained only as long as necessary or required by law
• Can be deleted upon request

4. Legal Bases for Processing (EEA Users)
Under the General Data Protection Regulation, we rely on:
• Consent
• Contract performance
• Legitimate interests

5. Your Privacy Rights
Depending on your location, including under:
• California Consumer Privacy Act (https://oag.ca.gov/privacy/ccpa)
• California Privacy Rights Act (https://cppa.ca.gov)
• General Data Protection Regulation (https://gdpr.eu)

You may have the right to:
• Access your personal data
• Correct inaccurate data
• Request deletion
• Restrict or object to processing
• Request data portability
• Withdraw consent
To exercise your rights, contact us using the information below.

6. Data Retention
We retain personal data only as long as necessary to provide the Service and comply with legal obligations. Biometric data is deleted when no longer needed or upon user request, unless retention is required by law.

7. Data Sharing
We do not sell your personal data. We may share data with:
• Service providers (such as cloud hosting and AI processing providers)
• Payment processors
• Legal authorities when required
All third parties are required to protect your data.

8. Data Security
We implement reasonable technical and organizational safeguards to protect your information. However, no system is completely secure.

9. International Data Transfers
Your data may be transferred and processed in countries outside your jurisdiction, including the United States. We take appropriate measures to ensure data protection consistent with applicable laws.

10. Children’s Privacy
Kyvo is not intended for individuals under 18. We do not knowingly collect data from minors.

11. Changes to This Policy
We may update this Privacy Policy. Continued use of the Service means you accept the updated Policy.

12. Contact
info@kyvoapp.com`;

export default function LegalModal({ visible, onClose, type }: LegalModalProps) {
  const { isDarkMode } = useTheme();
  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const borderColor = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const title = type === "terms" ? "Terms & Conditions" : "Privacy Policy";
  const content = type === "terms" ? TERMS_TEXT : PRIVACY_TEXT;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "fullScreen"} 
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.text, { color: textColor, opacity: 0.8 }]}>{content}</Text>
          </ScrollView>
          
          <View style={[styles.footer, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <LinearGradient
                colors={["#58CC02", "#46A302"]}
                style={styles.doneButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.doneButtonText}>I Understand</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    position: "absolute",
    right: 20,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#58CC02",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

