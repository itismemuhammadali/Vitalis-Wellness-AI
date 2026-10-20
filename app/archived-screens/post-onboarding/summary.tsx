import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SummaryScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const cardBg = isDarkMode ? '#1A2332' : '#FFFFFF';
  const accentColor = '#7FFF00';

  const handleContinue = () => {
    router.push('/screens/home');
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.successIcon, { backgroundColor: `${accentColor}20` }]}>
            <MaterialCommunityIcons name="check-circle" size={80} color={accentColor} />
          </View>
        </View>

        {/* Main Message */}
        <Text style={[styles.title, { color: textPrimary }]}>
          You're All Set!
        </Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Welcome to your transformation journey. You're in great hands with our community of like-minded individuals committed to personal growth.
        </Text>

        {/* Assurance Section */}
        <View style={[styles.assuranceCard, { backgroundColor: cardBg }]}>
          <View style={styles.assuranceItem}>
            <MaterialCommunityIcons name="shield-check" size={24} color={accentColor} />
            <View style={styles.assuranceText}>
              <Text style={[styles.assuranceTitle, { color: textPrimary }]}>
                Your Privacy is Protected
              </Text>
              <Text style={[styles.assuranceDesc, { color: textSecondary }]}>
                All your data is encrypted and secure
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.assuranceItem}>
            <MaterialCommunityIcons name="heart" size={24} color={accentColor} />
            <View style={styles.assuranceText}>
              <Text style={[styles.assuranceTitle, { color: textPrimary }]}>
                Expert Support Available
              </Text>
              <Text style={[styles.assuranceDesc, { color: textSecondary }]}>
                24/7 access to resources and guidance
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.assuranceItem}>
            <MaterialCommunityIcons name="trending-up" size={24} color={accentColor} />
            <View style={styles.assuranceText}>
              <Text style={[styles.assuranceTitle, { color: textPrimary }]}>
                Proven Results
              </Text>
              <Text style={[styles.assuranceDesc, { color: textSecondary }]}>
                Join thousands on their transformation path
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: accentColor }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Let's Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  assuranceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  assuranceText: {
    flex: 1,
  },
  assuranceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  assuranceDesc: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A3142',
    marginVertical: 16,
  },
  spacer: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
