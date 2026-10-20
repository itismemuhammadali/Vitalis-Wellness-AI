// Gamification Types

export type Level = 'Beginner' | 'Consistent' | 'Elite' | 'Unbreakable';

export interface UserXP {
  totalXP: number;
  currentLevel: Level;
  levelProgress: number; // 0-100
  xpToNextLevel: number;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  category: 'consistency' | 'progress' | 'gamification' | 'multi-goal' | 'comeback';
}

export interface XPTransaction {
  id: string;
  amount: number;
  type: 'log' | 'streak_bonus' | 'milestone' | 'achievement' | 'penalty';
  reason: string;
  multiplier: number;
  timestamp: string;
}

export interface GamificationState {
  xp: UserXP;
  streak: Streak;
  achievements: Achievement[];
  recentXPPopup?: {
    amount: number;
    timestamp: number;
  };
}
