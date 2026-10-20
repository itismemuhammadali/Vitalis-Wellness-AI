import { useAvatars } from '@/context/AvatarContext';
import { useAvatarUpdateService } from '@/services/avatarUpdateService';
import { useCallback } from 'react';

/**
 * Hook to integrate goal progress tracking with avatar updates
 * 
 * Usage:
 * const { handleGoalProgressUpdate } = useGoalAvatarIntegration();
 * 
 * // When user logs activity and updates goal progress
 * await handleGoalProgressUpdate({
 *   goalId: 'goal-123',
 *   goalType: 'weight_loss',
 *   currentProgress: 7,
 *   targetProgress: 10,
 * });
 */

export interface GoalProgressUpdate {
  goalId: string;
  goalType: string;
  currentProgress: number;
  targetProgress: number;
}

export function useGoalAvatarIntegration() {
  const { avatars } = useAvatars();
  const { updateAvatarOnGoalProgress } = useAvatarUpdateService();

  const handleGoalProgressUpdate = useCallback(
    async (update: GoalProgressUpdate) => {
      try {
        // Get the first (and only) avatar
        const avatar = avatars[0];
        if (!avatar) {
          console.log('No avatar found, skipping avatar update');
          return null;
        }

        // Calculate progress percentage
        const progressPercentage = Math.round(
          (update.currentProgress / update.targetProgress) * 100
        );

        console.log(
          `Goal Progress: ${update.currentProgress}/${update.targetProgress} (${progressPercentage}%)`
        );

        // Update avatar if milestone reached
        const updatedImageUri = await updateAvatarOnGoalProgress(
          avatar.id,
          update.goalId,
          progressPercentage,
          update.goalType
        );

        if (updatedImageUri) {
          console.log('Avatar updated successfully:', updatedImageUri);
          return {
            success: true,
            message: `Avatar updated to reflect ${progressPercentage}% progress!`,
            imageUri: updatedImageUri,
          };
        } else {
          console.log('Progress has not reached a milestone yet');
          return {
            success: false,
            message: 'Keep going! Avatar will update at the next milestone.',
          };
        }
      } catch (error) {
        console.error('Failed to handle goal progress update:', error);
        return {
          success: false,
          message: 'Failed to update avatar',
          error,
        };
      }
    },
    [avatars, updateAvatarOnGoalProgress]
  );

  const getProgressMilestones = useCallback((targetProgress: number) => {
    return {
      milestone_25: Math.round(targetProgress * 0.25),
      milestone_50: Math.round(targetProgress * 0.5),
      milestone_75: Math.round(targetProgress * 0.75),
      milestone_100: targetProgress,
    };
  }, []);

  return {
    handleGoalProgressUpdate,
    getProgressMilestones,
  };
}
