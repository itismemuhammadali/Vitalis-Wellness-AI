import BottomNavbar from '@/app/widgets/BottomNavbar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface Capsule {
  id: string;
  icon: string;
  title: string;
  type: string;
  unlocksIn: string;
  date: string;
  locked: boolean;
}

const SAMPLE_CAPSULES: Capsule[] = [
  {
    id: '1',
    icon: '💬',
    title: 'Text Message',
    type: 'Text',
    unlocksIn: '87 days',
    date: 'June 10, 2026',
    locked: true,
  },
];

export default function TimCapsulesScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { unlockTime, calculateCountdown } = useTimeCapsule();

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';

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
            Your Time Capsules
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          View and manage your sealed messages
        </ThemedText>

        {/* Sealed Capsules Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Sealed Capsules ({SAMPLE_CAPSULES.length})
          </ThemedText>

          {SAMPLE_CAPSULES.map((capsule) => (
            <View
              key={capsule.id}
              style={[
                styles.capsuleCard,
                {
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                },
              ]}
            >
              <View style={styles.capsuleHeader}>
                <View style={styles.capsuleLeft}>
                  <ThemedText style={styles.capsuleIcon}>{capsule.icon}</ThemedText>
                  <View style={styles.capsuleInfo}>
                    <ThemedText style={[styles.capsuleTitle, { color: textPrimary }]}>
                      {capsule.title}
                    </ThemedText>
                    <ThemedText style={[styles.capsuleType, { color: textSecondary }]}>
                      {capsule.type}
                    </ThemedText>
                  </View>
                </View>
                {capsule.locked && (
                  <ThemedText style={[styles.lockIcon, { color: '#58CC02' }]}>
                    🔒
                  </ThemedText>
                )}
              </View>

              <View style={styles.capsuleDetails}>
                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
                    📅
                  </ThemedText>
                  <View>
                    <ThemedText style={[styles.detailValue, { color: '#58CC02' }]}>
                      Unlocks in {capsule.unlocksIn}
                    </ThemedText>
                    <ThemedText style={[styles.detailDate, { color: textSecondary }]}>
                      {capsule.date}
                    </ThemedText>
                    {unlockTime && (
                      <ThemedText style={[styles.countdownText, { color: '#58CC02', marginTop: 4 }]}>
                        {calculateCountdown(unlockTime)}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.viewDetailsButton,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                <ThemedText style={[styles.viewDetailsText, { color: textSecondary }]}>
                  View Details
                </ThemedText>
                <ThemedText style={[styles.deleteIcon, { color: '#FF4B4B' }]}>
                  🗑️
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Premium Section */}
        <View
          style={[
            styles.premiumCard,
            {
              backgroundColor: 'transparent',
              borderColor: '#58CC02',
            },
          ]}
        >
          <ThemedText style={[styles.premiumIcon, { color: '#FFD700' }]}>
            ✨
          </ThemedText>
          <ThemedText style={[styles.premiumTitle, { color: textPrimary }]}>
            Upgrade to Premium
          </ThemedText>
          <ThemedText style={[styles.premiumSubtitle, { color: textSecondary }]}>
            Create unlimited capsules with video & voice
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              {
                backgroundColor: '#58CC02',
              },
            ]}
          >
            <ThemedText style={[styles.upgradeButtonText, { color: '#FFFFFF' }]}>
              Upgrade Now
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Plan Details */}
        <View style={styles.section}>
          <ThemedText style={[styles.planTitle, { color: textPrimary }]}>
            Your Plan: Free
          </ThemedText>
          <View style={styles.planFeatures}>
            <View style={styles.planFeature}>
              <ThemedText style={[styles.checkIcon, { color: '#58CC02' }]}>
                ✓
              </ThemedText>
              <ThemedText style={[styles.featureText, { color: textPrimary }]}>
                1 Capsule
              </ThemedText>
            </View>
            <View style={styles.planFeature}>
              <ThemedText style={[styles.checkIcon, { color: '#58CC02' }]}>
                ✓
              </ThemedText>
              <ThemedText style={[styles.featureText, { color: textPrimary }]}>
                Text Only
              </ThemedText>
            </View>
            <View style={styles.planFeature}>
              <ThemedText style={[styles.checkIcon, { color: '#58CC02' }]}>
                ✓
              </ThemedText>
              <ThemedText style={[styles.featureText, { color: textPrimary }]}>
                Single Timeline
              </ThemedText>
            </View>
            <View style={styles.planFeature}>
              <ThemedText style={[styles.xIcon, { color: textSecondary }]}>
                ✕
              </ThemedText>
              <ThemedText style={[styles.featureText, { color: textSecondary }]}>
                Video & Voice
              </ThemedText>
            </View>
            <View style={styles.planFeature}>
              <ThemedText style={[styles.xIcon, { color: textSecondary }]}>
                ✕
              </ThemedText>
              <ThemedText style={[styles.featureText, { color: textSecondary }]}>
                Multiple Timelines
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Spacer for navbar */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Navbar */}
      <BottomNavbar />
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
    marginBottom: 8,
  },
  backButton: {
    fontSize: 28,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  capsuleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  capsuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  capsuleIcon: {
    fontSize: 32,
  },
  capsuleInfo: {
    flex: 1,
  },
  capsuleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  capsuleType: {
    fontSize: 12,
  },
  lockIcon: {
    fontSize: 20,
  },
  capsuleDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailDate: {
    fontSize: 11,
    marginTop: 2,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteIcon: {
    fontSize: 16,
  },
  premiumCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  planFeatures: {
    gap: 8,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  xIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 12,
  },
  spacer: {
    height: 20,
  },
});
