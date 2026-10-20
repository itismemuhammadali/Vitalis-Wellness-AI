// XP System - Calculations and Level Management

import { Level, UserXP } from './types';

// XP Thresholds for each level (50 XP per level)
const LEVEL_THRESHOLDS = {
  Beginner: 0,
  Consistent: 50,
  Elite: 100,
  Unbreakable: 150,
};

const LEVEL_ORDER: Level[] = ['Beginner', 'Consistent', 'Elite', 'Unbreakable'];

// Base XP values
export const XP_VALUES = {
  BASE_LOG: 50,
  STREAK_BONUS_PER_DAY: 10,
  CONSISTENCY_MULTIPLIER: 1.5, // For 7+ day streaks
  MILESTONE_BONUS: 100,
  ACHIEVEMENT_REWARD: (xpReward: number) => xpReward,
  MISS_LOG_PENALTY: -25,
  FALL_BEHIND_PENALTY: -10,
  RELAPSE_PENALTY: -100,
};

/**
 * Calculate current level number based on total XP (1-indexed)
 */
export function calculateLevelNumber(totalXP: number): number {
  return Math.floor(totalXP / 50) + 1;
}

/**
 * Calculate current level based on total XP
 */
export function calculateLevel(totalXP: number): Level {
  if (totalXP >= LEVEL_THRESHOLDS.Unbreakable) return 'Unbreakable';
  if (totalXP >= LEVEL_THRESHOLDS.Elite) return 'Elite';
  if (totalXP >= LEVEL_THRESHOLDS.Consistent) return 'Consistent';
  return 'Beginner';
}

/**
 * Calculate progress to next level (0-100)
 */
export function calculateLevelProgress(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel);
  
  if (currentLevelIndex === LEVEL_ORDER.length - 1) {
    // Already at max level
    return 100;
  }

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextLevel = LEVEL_ORDER[currentLevelIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel];

  const progress = ((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Calculate XP needed to reach next level
 */
export function calculateXPToNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel);
  
  if (currentLevelIndex === LEVEL_ORDER.length - 1) {
    // Already at max level
    return 0;
  }

  const nextLevel = LEVEL_ORDER[currentLevelIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel];
  
  return Math.max(0, nextThreshold - totalXP);
}

/**
 * Calculate XP earned from logging with multipliers
 */
export function calculateLogXP(
  streakDays: number,
  isMilestoneDay: boolean = false
): number {
  let xp = XP_VALUES.BASE_LOG;

  // Streak bonus
  xp += streakDays * XP_VALUES.STREAK_BONUS_PER_DAY;

  // Consistency multiplier (7+ day streak)
  if (streakDays >= 7) {
    xp = Math.floor(xp * XP_VALUES.CONSISTENCY_MULTIPLIER);
  }

  // Milestone bonus
  if (isMilestoneDay) {
    xp += XP_VALUES.MILESTONE_BONUS;
  }

  return xp;
}

/**
 * Check if user leveled up
 */
export function checkLevelUp(
  previousXP: number,
  newXP: number
): { leveledUp: boolean; newLevel?: Level; previousLevel?: Level } {
  const previousLevel = calculateLevel(previousXP);
  const newLevel = calculateLevel(newXP);

  if (previousLevel !== newLevel) {
    return {
      leveledUp: true,
      previousLevel,
      newLevel,
    };
  }

  return { leveledUp: false };
}

/**
 * Get level color for UI
 */
export function getLevelColor(level: Level): string {
  const colors = {
    Beginner: '#4A90E2', // Blue
    Consistent: '#7ED321', // Green
    Elite: '#FFD700', // Gold
    Unbreakable: '#9013FE', // Purple
  };
  return colors[level];
}

/**
 * Calculate achievement based on current level
 */
export function calculateAchievement(currentLevel: number): string {
  if (currentLevel <= 5) return 'Beginner';
  if (currentLevel <= 15) return 'Achiever';
  if (currentLevel <= 30) return 'Streakholder';
  if (currentLevel <= 50) return 'Consistent';
  if (currentLevel <= 75) return 'Elite';
  return 'King';
}

/**
 * Get achievement color for UI
 */
export function getAchievementColor(achievement: string): string {
  const colors: { [key: string]: string } = {
    Beginner: '#4A90E2',      // Blue
    Achiever: '#7ED321',      // Green
    Streakholder: '#FFD700',  // Gold
    Consistent: '#FF8C00',    // Orange
    Elite: '#9013FE',         // Purple
    King: '#FF1493',          // Deep Pink
  };
  return colors[achievement] || '#4A90E2';
}

/**
 * Calculate total XP from user XP object
 */
export function getUserXPState(totalXP: number): UserXP {
  const currentLevel = calculateLevel(totalXP);
  const levelProgress = calculateLevelProgress(totalXP);
  const xpToNextLevel = calculateXPToNextLevel(totalXP);

  return {
    totalXP,
    currentLevel,
    levelProgress,
    xpToNextLevel,
  };
}
