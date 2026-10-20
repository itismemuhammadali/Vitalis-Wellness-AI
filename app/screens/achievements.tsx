import { AchievementBadge } from '@/app/components/GamificationComponents';
import { useGamification } from '@/app/context/GamificationContext';
import BottomNavbar from '@/app/widgets/BottomNavbar';
import { useTheme } from '@/context/ThemeContext';
import { getAchievementProgress, getAchievementsByCategory } from '@/lib/gamification/achievements';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PRIMARY_GREEN = '#58CC02';

type AchievementCategory = 'consistency' | 'progress' | 'gamification' | 'multi-goal' | 'comeback';

const CATEGORY_INFO: Record<AchievementCategory, { label: string; icon: string; color: string }> = {
  consistency: { label: 'Consistency', icon: '🔥', color: '#FF6B6B' },
  progress: { label: 'Progress', icon: '📈', color: '#7ED321' },
  gamification: { label: 'Gamification', icon: '⭐', color: '#FFD700' },
  'multi-goal': { label: 'Multi-Goal', icon: '🎯', color: '#4A90E2' },
  comeback: { label: 'Comeback', icon: '💪', color: '#9013FE' },
};

export default function AchievementsScreen() {
  const { isDarkMode } = useTheme();
  const { state: gamificationState } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('consistency');

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const cardBg = isDarkMode ? '#1A2332' : '#FFFFFF';
  const borderColor = isDarkMode ? '#2A3A4A' : '#E0E0E0';

  const achievements = gamificationState.achievements;
  const progress = getAchievementProgress(achievements);
  const categoryAchievements = getAchievementsByCategory(achievements, selectedCategory);

  const categories: AchievementCategory[] = [
    'consistency',
    'progress',
    'gamification',
    'multi-goal',
    'comeback',
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Achievements</Text>
          <Text style={[styles.headerSubtitle, { color: subtitleColor }]}>
            Unlock badges and earn rewards
          </Text>
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: subtitleColor }]}>
              Achievements Unlocked
            </Text>
            <Text style={[styles.progressValue, { color: PRIMARY_GREEN }]}>
              {progress.unlocked}/{progress.total}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress.percentage}%`, backgroundColor: PRIMARY_GREEN },
              ]}
            />
          </View>

          <Text style={[styles.progressPercentage, { color: textColor }]}>
            {progress.percentage}% Complete
          </Text>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          {categories.map((category) => {
            const info = CATEGORY_INFO[category];
            const isSelected = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: isSelected ? info.color : cardBg,
                    borderColor: isSelected ? info.color : borderColor,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={styles.categoryTabIcon}>{info.icon}</Text>
                <Text
                  style={[
                    styles.categoryTabLabel,
                    {
                      color: isSelected ? '#FFFFFF' : textColor,
                      fontSize: 11,
                    },
                  ]}
                >
                  {info.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsGrid}>
          {categoryAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <AchievementBadge
                title={achievement.title}
                icon={achievement.icon}
                xpReward={achievement.xpReward}
                isUnlocked={achievement.isUnlocked}
                isDarkMode={isDarkMode}
                size="medium"
              />
              <Text
                style={[
                  styles.achievementTitle,
                  {
                    color: achievement.isUnlocked ? textColor : subtitleColor,
                  },
                ]}
              >
                {achievement.title}
              </Text>
              <Text
                style={[
                  styles.achievementDescription,
                  {
                    color: achievement.isUnlocked ? subtitleColor : '#999999',
                  },
                ]}
              >
                {achievement.description}
              </Text>
              <View style={styles.achievementXP}>
                <MaterialCommunityIcons
                  name="star"
                  size={12}
                  color={achievement.isUnlocked ? PRIMARY_GREEN : '#CCCCCC'}
                />
                <Text
                  style={[
                    styles.achievementXPText,
                    {
                      color: achievement.isUnlocked ? PRIMARY_GREEN : '#CCCCCC',
                    },
                  ]}
                >
                  +{achievement.xpReward} XP
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {categoryAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateIcon]}>🎯</Text>
            <Text style={[styles.emptyStateText, { color: textColor }]}>
              No achievements in this category yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: subtitleColor }]}>
              Keep logging and progressing to unlock more
            </Text>
          </View>
        )}

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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  categoryTab: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryTabLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  achievementItem: {
    width: '48%',
    alignItems: 'center',
    gap: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  achievementXPText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
});
