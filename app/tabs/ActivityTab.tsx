import { useAuth } from '@/app/context/AuthContext';
import { getGoalIcon } from '@/app/lib/goalIconLibrary';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

interface CompletedGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  aspiration: string;
  completion_percentage: number;
  log_date: string;
  status: string;
}

export default function ActivityTab() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [completedGoals, setCompletedGoals] = useState<CompletedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0 });

  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';

  const categoryIcons: Record<string, string> = {
    'Freelancing': '💼',
    'Skill Development': '🧠',
    'Fitness': '💪',
    'Networking': '🤝',
    'Financial': '💰',
    'Health': '🏥',
    'Career': '🚀',
    'default': '⭐',
  };

  const categoryColors: Record<string, string[]> = {
    'Freelancing': ['#FF6B6B', '#FF8E8E'],
    'Skill Development': ['#1F9FFF', '#4DB8FF'],
    'Fitness': ['#A78BFA', '#C9B1FF'],
    'Networking': ['#FFB84D', '#FFD180'],
    'Financial': ['#58CC02', '#7FD814'],
    'Health': ['#FF6B9D', '#FF99B9'],
    'Career': ['#00D9FF', '#33E9FF'],
    'default': ['#58CC02', '#7FD814'],
  };

  useFocusEffect(
    useCallback(() => {
      fetchCompletedGoals();
    }, [user?.id])
  );

  const fetchCompletedGoals = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Fetch completed goals from daily_goal_logs
      const { data: logs, error: logsError } = await supabase
        .from('daily_goal_logs')
        .select('goal_id, completion_percentage, status, log_date')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('log_date', { ascending: false })
        .limit(50) as any;

      if (logsError) throw logsError;

      // Fetch goal details
      if (logs && logs.length > 0) {
        const goalIds = logs.map((l: any) => l.goal_id);
        const { data: goals, error: goalsError } = await supabase
          .from('generated_goals')
          .select('id, title, description, category, aspiration')
          .in('id', goalIds) as any;

        if (goalsError) throw goalsError;

        // Merge logs with goal details
        const merged = logs.map((log: any) => {
          const goal = (goals as any[])?.find((g: any) => g.id === log.goal_id);
          return {
            id: log.goal_id,
            title: goal?.title || 'Goal',
            description: goal?.description || '',
            category: goal?.category || 'default',
            aspiration: goal?.aspiration || '',
            completion_percentage: log.completion_percentage,
            log_date: log.log_date,
            status: log.status,
          };
        });

        setCompletedGoals(merged);

        // Calculate stats
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekGoals = merged.filter((g: CompletedGoal) => new Date(g.log_date) >= weekAgo).length;

        setStats({
          total: merged.length,
          thisWeek: thisWeekGoals,
          streak: calculateStreak(merged),
        });
      }
    } catch (error) {
      console.error('Error fetching completed goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (goals: CompletedGoal[]): number => {
    if (goals.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (goals.some(g => g.log_date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: textPrimary }]}>
            🏆 Your Achievements
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Celebrate your completed goals
          </ThemedText>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient colors={['#58CC02', '#7FD814']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="target" size={24} color="#FFFFFF" />
            <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Completed</ThemedText>
          </LinearGradient>

          <LinearGradient colors={['#1F9FFF', '#4DB8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-week" size={24} color="#FFFFFF" />
            <ThemedText style={styles.statValue}>{stats.thisWeek}</ThemedText>
            <ThemedText style={styles.statLabel}>This Week</ThemedText>
          </LinearGradient>

          <LinearGradient colors={['#FF6B9D', '#FF99B9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={24} color="#FFFFFF" />
            <ThemedText style={styles.statValue}>{stats.streak}</ThemedText>
            <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
          </LinearGradient>
        </View>

        {/* Completed Goals List */}
        <View style={styles.goalsSection}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            ✨ Recent Completions
          </ThemedText>

          {completedGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                No completed goals yet. Start logging your progress!
              </ThemedText>
            </View>
          ) : (
            completedGoals.map((goal) => {
              const colors = categoryColors[goal.category] || categoryColors.default;
              const icon = getGoalIcon(goal.title, goal.description);

              return (
                <LinearGradient
                  key={goal.id}
                  colors={colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goalCardGradient}
                >
                  <View style={[styles.goalCard, { backgroundColor: cardBg }]}>
                    <View style={styles.goalHeader}>
                      <ThemedText style={styles.goalIcon}>{icon}</ThemedText>
                      <View style={styles.goalTitleContainer}>
                        <ThemedText style={[styles.goalTitle, { color: textPrimary }]} numberOfLines={1}>
                          {goal.title}
                        </ThemedText>
                      </View>
                      <View style={styles.badgeContainer}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#58CC02" />
                      </View>
                    </View>

                    <View style={styles.goalFooter}>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${goal.completion_percentage}%`,
                                backgroundColor: colors[0],
                              },
                            ]}
                          />
                        </View>
                        <ThemedText style={[styles.progressText, { color: textSecondary }]}>
                          {goal.completion_percentage}%
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.goalDate, { color: textSecondary }]}>
                        {formatDate(goal.log_date)}
                      </ThemedText>
                    </View>
                  </View>
                </LinearGradient>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  goalsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  goalCardGradient: {
    borderRadius: 16,
    padding: 2,
    marginBottom: 12,
  },
  goalCard: {
    borderRadius: 14,
    padding: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  goalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  goalIcon: {
    fontSize: 32,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 12,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  goalDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  goalFooter: {
    gap: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  goalDate: {
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
