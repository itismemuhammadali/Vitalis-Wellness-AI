import { checkAchievementUnlock, getAllAchievements } from '@/lib/gamification/achievements';
import { updateStreakAfterLog } from '@/lib/gamification/streak-system';
import { GamificationState } from '@/lib/gamification/types';
import { calculateAchievement, calculateLevelNumber, calculateLogXP, checkLevelUp, getUserXPState } from '@/lib/gamification/xp-system';
import { supabase } from '@/lib/supabase';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface GamificationContextType {
  state: GamificationState;
  
  // XP Management
  addXP: (amount: number, reason: string) => void;
  logActivity: (streakDays: number, isMilestone?: boolean) => void;
  loadXPFromDatabase: (userId: string) => Promise<void>;
  getCurrentAchievement: () => string;
  
  // Streak Management
  updateStreak: (newStreak: number, newLongest: number) => void;
  loadStreakFromDatabase: (userId: string) => Promise<void>;
  
  // Achievement Management
  unlockAchievement: (achievementId: string) => void;
  checkAchievements: (stats: any) => void;
  
  // Reset
  resetGamification: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// Mock initial state - in production, this would come from Supabase
const INITIAL_STATE: GamificationState = {
  xp: {
    totalXP: 0,
    currentLevel: 'Beginner',
    levelProgress: 0,
    xpToNextLevel: 50,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: '',
  },
  achievements: getAllAchievements([], {}),
};

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GamificationState>(INITIAL_STATE);

  const addXP = useCallback((amount: number, reason: string) => {
    setState((prev) => {
      const newTotalXP = prev.xp.totalXP + amount;
      const newXPState = getUserXPState(newTotalXP);
      const levelUpInfo = checkLevelUp(prev.xp.totalXP, newTotalXP);

      return {
        ...prev,
        xp: newXPState,
        recentXPPopup: {
          amount,
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const logActivity = useCallback((streakDays: number, isMilestone = false) => {
    setState((prev) => {
      const xpEarned = calculateLogXP(streakDays, isMilestone);
      const newTotalXP = prev.xp.totalXP + xpEarned;
      const newXPState = getUserXPState(newTotalXP);

      const { newStreak, newLongest } = updateStreakAfterLog(
        prev.streak.currentStreak,
        prev.streak.longestStreak,
        prev.streak.lastLogDate
      );

      const today = new Date().toISOString().split('T')[0];

      return {
        ...prev,
        xp: newXPState,
        streak: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastLogDate: today,
        },
        recentXPPopup: {
          amount: xpEarned,
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const updateStreak = useCallback((newStreak: number, newLongest: number) => {
    setState((prev) => ({
      ...prev,
      streak: {
        ...prev.streak,
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    }));
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    setState((prev) => {
      const achievement = prev.achievements.find((a) => a.id === achievementId);
      if (!achievement || achievement.isUnlocked) return prev;

      const updatedAchievements = prev.achievements.map((a) =>
        a.id === achievementId
          ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString() }
          : a
      );

      // Add XP for achievement
      const xpReward = achievement.xpReward;
      const newTotalXP = prev.xp.totalXP + xpReward;
      const newXPState = getUserXPState(newTotalXP);

      return {
        ...prev,
        achievements: updatedAchievements,
        xp: newXPState,
        recentXPPopup: {
          amount: xpReward,
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const checkAchievements = useCallback((stats: any) => {
    setState((prev) => {
      const updatedAchievements = prev.achievements.map((achievement) => {
        if (achievement.isUnlocked) return achievement;

        const shouldUnlock = checkAchievementUnlock(achievement.id, stats);
        if (shouldUnlock) {
          return {
            ...achievement,
            isUnlocked: true,
            unlockedAt: new Date().toISOString(),
          };
        }

        return achievement;
      });

      return {
        ...prev,
        achievements: updatedAchievements,
      };
    });
  }, []);

  const resetGamification = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const loadXPFromDatabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await (supabase.from('user_xp') as any)
        .select('total_xp')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('No XP data found, initializing with 0 XP');
        // Initialize with 0 XP if no record exists
        setState((prev) => ({
          ...prev,
          xp: getUserXPState(0),
        }));
        return;
      }

      if (data && typeof data.total_xp === 'number') {
        console.log('✅ Loaded XP from database:', data.total_xp);
        const newXPState = getUserXPState(data.total_xp);
        setState((prev) => ({
          ...prev,
          xp: newXPState,
        }));
      }
    } catch (err) {
      console.error('Error loading XP from database:', err);
    }
  }, []);

  const getCurrentAchievement = useCallback(() => {
    const levelNumber = calculateLevelNumber(state.xp.totalXP);
    return calculateAchievement(levelNumber);
  }, [state.xp.totalXP]);

  const loadStreakFromDatabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await (supabase.from('user_streak') as any)
        .select('current_streak, longest_streak, last_log_date')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('No streak data found, initializing with 0');
        setState((prev) => ({
          ...prev,
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastLogDate: '',
          },
        }));
        return;
      }

      if (data) {
        console.log('✅ Loaded streak from database:', data.current_streak);
        setState((prev) => ({
          ...prev,
          streak: {
            currentStreak: data.current_streak || 0,
            longestStreak: data.longest_streak || 0,
            lastLogDate: data.last_log_date || '',
          },
        }));
      }
    } catch (err) {
      console.error('Error loading streak from database:', err);
    }
  }, []);

  const value: GamificationContextType = useMemo(() => ({
    state,
    addXP,
    logActivity,
    loadXPFromDatabase,
    getCurrentAchievement,
    updateStreak,
    unlockAchievement,
    checkAchievements,
    resetGamification,
    loadStreakFromDatabase,
  }), [state, addXP, logActivity, loadXPFromDatabase, getCurrentAchievement, updateStreak, unlockAchievement, checkAchievements, resetGamification, loadStreakFromDatabase]);

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};
