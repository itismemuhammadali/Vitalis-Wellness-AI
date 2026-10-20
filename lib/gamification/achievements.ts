// Achievement System

import { Achievement } from './types';

export const ACHIEVEMENTS: Record<string, Omit<Achievement, 'isUnlocked' | 'unlockedAt'>> = {
  // Consistency Achievements
  first_log: {
    id: 'first_log',
    title: 'First Step',
    description: 'Log your first progress',
    icon: '🎯',
    xpReward: 25,
    category: 'consistency',
  },
  week_warrior: {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xpReward: 50,
    category: 'consistency',
  },
  month_master: {
    id: 'month_master',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    xpReward: 200,
    category: 'consistency',
  },
  unbreakable: {
    id: 'unbreakable',
    title: 'Unbreakable',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    xpReward: 500,
    category: 'consistency',
  },

  // Progress Achievements
  first_step: {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete 25% of a goal',
    icon: '👣',
    xpReward: 25,
    category: 'progress',
  },
  halfway_there: {
    id: 'halfway_there',
    title: 'Halfway There',
    description: 'Complete 50% of a goal',
    icon: '🏃',
    xpReward: 100,
    category: 'progress',
  },
  almost_there: {
    id: 'almost_there',
    title: 'Almost There',
    description: 'Complete 75% of a goal',
    icon: '🎪',
    xpReward: 150,
    category: 'progress',
  },
  goal_crusher: {
    id: 'goal_crusher',
    title: 'Goal Achiever',
    description: 'Complete a goal',
    icon: '🎯',
    xpReward: 250,
    category: 'progress',
  },

  // Gamification Achievements
  xp_collector: {
    id: 'xp_collector',
    title: 'XP Collector',
    description: 'Earn 500 total XP',
    icon: '⭐',
    xpReward: 50,
    category: 'gamification',
  },
  level_up: {
    id: 'level_up',
    title: 'Level Up',
    description: 'Reach Consistent level',
    icon: '📈',
    xpReward: 100,
    category: 'gamification',
  },
  elite_status: {
    id: 'elite_status',
    title: 'Elite Status',
    description: 'Reach Elite level',
    icon: '🏆',
    xpReward: 200,
    category: 'gamification',
  },
  unbreakable_force: {
    id: 'unbreakable_force',
    title: 'Unbreakable Force',
    description: 'Reach Unbreakable level',
    icon: '⚡',
    xpReward: 500,
    category: 'gamification',
  },

  // Multi-Goal Achievements
  dual_threat: {
    id: 'dual_threat',
    title: 'Dual Threat',
    description: 'Maintain 2 active goals',
    icon: '🎯🎯',
    xpReward: 75,
    category: 'multi-goal',
  },
  triple_threat: {
    id: 'triple_threat',
    title: 'Triple Threat',
    description: 'Maintain 3 active goals',
    icon: '🎯🎯🎯',
    xpReward: 150,
    category: 'multi-goal',
  },
  master_of_all: {
    id: 'master_of_all',
    title: 'Master of All',
    description: 'Maintain 4+ active goals',
    icon: '🌟',
    xpReward: 250,
    category: 'multi-goal',
  },

  // Comeback Achievements
  phoenix_rising: {
    id: 'phoenix_rising',
    title: 'Phoenix Rising',
    description: 'Recover from a 3-day break',
    icon: '🔥',
    xpReward: 100,
    category: 'comeback',
  },
  never_give_up: {
    id: 'never_give_up',
    title: 'Never Give Up',
    description: 'Recover from a 7-day break',
    icon: '💪',
    xpReward: 250,
    category: 'comeback',
  },
};

/**
 * Check if achievement should be unlocked
 */
export function checkAchievementUnlock(
  achievementId: string,
  stats: {
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
    goalsCompleted: number;
    activeGoals: number;
    currentLevel: string;
    lastBreakDays?: number;
  }
): boolean {
  switch (achievementId) {
    // Consistency
    case 'first_log':
      return stats.totalXP >= 50;
    case 'week_warrior':
      return stats.currentStreak >= 7;
    case 'month_master':
      return stats.longestStreak >= 30;
    case 'unbreakable':
      return stats.longestStreak >= 100;

    // Progress
    case 'first_step':
      return stats.goalsCompleted >= 1;
    case 'halfway_there':
      return stats.goalsCompleted >= 1;
    case 'almost_there':
      return stats.goalsCompleted >= 1;
    case 'goal_crusher':
      return stats.goalsCompleted >= 1;

    // Gamification
    case 'xp_collector':
      return stats.totalXP >= 500;
    case 'level_up':
      return stats.currentLevel === 'Consistent' || stats.currentLevel === 'Elite' || stats.currentLevel === 'Unbreakable';
    case 'elite_status':
      return stats.currentLevel === 'Elite' || stats.currentLevel === 'Unbreakable';
    case 'unbreakable_force':
      return stats.currentLevel === 'Unbreakable';

    // Multi-Goal
    case 'dual_threat':
      return stats.activeGoals >= 2;
    case 'triple_threat':
      return stats.activeGoals >= 3;
    case 'master_of_all':
      return stats.activeGoals >= 4;

    // Comeback
    case 'phoenix_rising':
      return stats.lastBreakDays ? stats.lastBreakDays >= 3 && stats.currentStreak >= 1 : false;
    case 'never_give_up':
      return stats.lastBreakDays ? stats.lastBreakDays >= 7 && stats.currentStreak >= 1 : false;

    default:
      return false;
  }
}

/**
 * Get all achievements with unlock status
 */
export function getAllAchievements(
  unlockedIds: string[] = [],
  unlockedDates: Record<string, string> = {}
): Achievement[] {
  return Object.values(ACHIEVEMENTS).map((achievement) => ({
    ...achievement,
    isUnlocked: unlockedIds.includes(achievement.id),
    unlockedAt: unlockedDates[achievement.id],
  }));
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(
  achievements: Achievement[],
  category: Achievement['category']
): Achievement[] {
  return achievements.filter((a) => a.category === category);
}

/**
 * Get achievement progress
 */
export function getAchievementProgress(
  achievements: Achievement[]
): { unlocked: number; total: number; percentage: number } {
  const unlocked = achievements.filter((a) => a.isUnlocked).length;
  const total = achievements.length;
  const percentage = Math.round((unlocked / total) * 100);

  return { unlocked, total, percentage };
}
