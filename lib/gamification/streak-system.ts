// Streak System

import { Streak } from './types';

/**
 * Calculate streak based on last log date
 */
export function calculateStreak(lastLogDate: string | null): number {
  if (!lastLogDate) return 0;

  const last = new Date(lastLogDate);
  const today = new Date();
  
  // Reset time to midnight for accurate day calculation
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // If logged today or yesterday, streak continues
  if (diffDays <= 1) {
    return 1;
  }

  // If more than 1 day has passed, streak is broken
  return 0;
}

/**
 * Update streak after logging
 */
export function updateStreakAfterLog(
  currentStreak: number,
  longestStreak: number,
  lastLogDate: string | null
): { newStreak: number; newLongest: number } {
  const today = new Date().toISOString().split('T')[0];
  
  // If already logged today, don't increment
  if (lastLogDate === today) {
    return { newStreak: currentStreak, newLongest: longestStreak };
  }

  // Calculate if streak continues
  const streakContinues = calculateStreak(lastLogDate) > 0;
  const newStreak = streakContinues ? currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, longestStreak);

  return { newStreak, newLongest };
}

/**
 * Get streak milestone bonus
 */
export function getStreakMilestoneBonus(streak: number): { isMilestone: boolean; bonus: number } {
  const milestones = [7, 14, 30, 60, 100, 365];
  
  if (milestones.includes(streak)) {
    return { isMilestone: true, bonus: 50 };
  }

  return { isMilestone: false, bonus: 0 };
}

/**
 * Get next streak milestone
 */
export function getNextStreakMilestone(currentStreak: number): number {
  const milestones = [7, 14, 30, 60, 100, 365];
  
  for (const milestone of milestones) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }

  return 365; // Max milestone
}

/**
 * Get streak status message
 */
export function getStreakStatusMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today';
  if (streak === 1) return 'Day 1 - Great start!';
  if (streak < 7) return `Day ${streak} - Keep it up!`;
  if (streak < 30) return `Day ${streak} - You\'re on fire! 🔥`;
  if (streak < 100) return `Day ${streak} - Unstoppable! 💪`;
  return `Day ${streak} - Legendary! 👑`;
}

/**
 * Get streak color based on length
 */
export function getStreakColor(streak: number): string {
  if (streak === 0) return '#B0B0B0'; // Gray
  if (streak < 7) return '#FFD700'; // Gold
  if (streak < 30) return '#FF6B6B'; // Red
  if (streak < 100) return '#FF4500'; // Orange-Red
  return '#9013FE'; // Purple
}

/**
 * Format streak display
 */
export function formatStreakDisplay(streak: number): string {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

/**
 * Get streak state
 */
export function getStreakState(
  currentStreak: number,
  longestStreak: number,
  lastLogDate: string | null
): Streak {
  return {
    currentStreak,
    longestStreak,
    lastLogDate: lastLogDate || '',
  };
}
