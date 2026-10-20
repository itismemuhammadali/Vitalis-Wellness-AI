import {
    AchievementBadge,
    GamificationStats,
    LevelBadge,
    XPBar,
} from '@/app/components/GamificationComponents';
import { useGamification } from '@/app/context/GamificationContext';
import BottomNavbar from '@/app/widgets/BottomNavbar';
import { useOnboardingAvatar } from '@/context/OnboardingAvatarContext';
import { useTheme } from '@/context/ThemeContext';
import { getAchievementProgress } from '@/lib/gamification/achievements';
import { getLevelDescription } from '@/lib/gamification/xp-system';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PRIMARY_GREEN = '#58CC02';

export default function GamificationProfileScreen() {
  const { isDarkMode } = useTheme();
  const { state: gamificationState } = useGamification();
  const { avatarUri } = useOnboardingAvatar();
  const router = useRouter();

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const cardBg = isDarkMode ? '#1A2332' : '#FFFFFF';
  const borderColor = isDarkMode ? '#2A3A4A' : '#E0E0E0';
  const shadowColor = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)';

  const xp = gamificationState.xp;
  const achievements = gamificationState.achievements;
  const achievementProgress = getAchievementProgress(achievements);
  const unlockedAchievements = achievements.filter((a: any) => a.isUnlocked).slice(0, 6);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
          <View style={styles.spacer} />
        </View>

        {/* Profile Card - Duolingo Style */}
        <View 
          style={[
            styles.profileCard, 
            { backgroundColor: cardBg, borderColor },
            Platform.OS === 'ios' && {
              shadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            Platform.OS === 'android' && {
              elevation: 6,
            }
          ]}
        >
          {/* Avatar */}
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.profileAvatar}
            />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: borderColor }]}>
              <MaterialCommunityIcons name="account" size={48} color={subtitleColor} />
            </View>
          )}

          {/* Level Badge */}
          <View style={styles.levelBadgeContainer}>
            <LevelBadge
              level={xp.currentLevel}
              isDarkMode={isDarkMode}
              size="medium"
            />
          </View>

          {/* Level Description */}
          <Text style={[styles.levelDescription, { color: subtitleColor }]}>
            {getLevelDescription(xp.currentLevel)}
          </Text>
        </View>

        {/* XP Bar */}
        <XPBar
          currentXP={xp.totalXP}
          xpToNextLevel={xp.xpToNextLevel}
          level={xp.currentLevel}
          progress={xp.levelProgress}
          isDarkMode={isDarkMode}
        />

        {/* Stats */}
        <GamificationStats
          totalXP={xp.totalXP}
          longestStreak={gamificationState.streak.longestStreak}
          goalsCompleted={0}
          achievementsUnlocked={achievementProgress.unlocked}
          isDarkMode={isDarkMode}
        />

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Achievements
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/screens/achievements')}
            >
              <Text style={[styles.seeAllButton, { color: '#58CC02' }]}>
                See All ({achievementProgress.unlocked}/{achievementProgress.total})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Achievement Grid */}
          <View style={styles.achievementGrid}>
            {unlockedAchievements.length > 0 ? (
              unlockedAchievements.map((achievement: any) => (
                <View key={achievement.id} style={styles.achievementGridItem}>
                  <AchievementBadge
                    title={achievement.title}
                    icon={achievement.icon}
                    xpReward={achievement.xpReward}
                    isUnlocked={achievement.isUnlocked}
                    isDarkMode={isDarkMode}
                    size="small"
                  />
                  <Text
                    style={[
                      styles.achievementGridTitle,
                      { color: textColor },
                    ]}
                    numberOfLines={2}
                  >
                    {achievement.title}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noAchievements}>
                <Text style={[styles.noAchievementsText, { color: subtitleColor }]}>
                  No achievements unlocked yet. Start logging to earn badges!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </View>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeContainer: {
    marginBottom: 16,
  },
  levelDescription: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  achievementGridItem: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  achievementGridTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  noAchievements: {
    width: '100%',
    paddingVertical: 24,
    alignItems: 'center',
  },
  noAchievementsText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
});
