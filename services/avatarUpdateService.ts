import { useAvatars } from '@/context/AvatarContext';
import { useAvatarUpdate } from '@/context/AvatarUpdateContext';

export interface GoalProgress {
  goalId: string;
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;
}

/**
 * Service to handle avatar updates based on goal progress
 * This should be called whenever a goal's progress is updated
 */
export class AvatarUpdateService {
  /**
   * Check if a goal has reached a milestone and trigger avatar update
   * Milestones: 25%, 50%, 75%, 100%
   */
  static getMilestonePercentage(progressPercentage: number): number | null {
    if (progressPercentage >= 100) return 100;
    if (progressPercentage >= 75) return 75;
    if (progressPercentage >= 50) return 50;
    if (progressPercentage >= 25) return 25;
    return null;
  }

  /**
   * Generate a prompt for OpenAI based on goal type and progress
   */
  static generateAvatarUpdatePrompt(
    goalType: string,
    progressPercentage: number
  ): string {
    const progressDescription = this.getProgressDescription(progressPercentage);

    const prompts: { [key: string]: string } = {
      weight_loss: `Update this person's appearance to show they have lost ${progressPercentage}% of their target weight. Make subtle but visible changes to their body shape and overall appearance. ${progressDescription}`,
      muscle_gain: `Update this person's appearance to show they have gained ${progressPercentage}% of their target muscle mass. Make subtle but visible changes to their muscle definition and body composition. ${progressDescription}`,
      fitness: `Update this person's appearance to reflect ${progressPercentage}% progress on their fitness goal. Show improved physique and healthier appearance. ${progressDescription}`,
      health: `Update this person's appearance to reflect ${progressPercentage}% progress on their health goal. Show a healthier, more vibrant appearance. ${progressDescription}`,
      default: `Update this person's appearance to reflect ${progressPercentage}% progress on their goal. Make subtle but visible positive changes. ${progressDescription}`,
    };

    return prompts[goalType] || prompts.default;
  }

  /**
   * Get a description of the progress level
   */
  private static getProgressDescription(progressPercentage: number): string {
    if (progressPercentage >= 100) {
      return 'This represents 100% completion - show the final transformed appearance.';
    } else if (progressPercentage >= 75) {
      return 'This represents 75% progress - show significant visible changes.';
    } else if (progressPercentage >= 50) {
      return 'This represents 50% progress - show noticeable changes.';
    } else if (progressPercentage >= 25) {
      return 'This represents 25% progress - show initial visible changes.';
    }
    return '';
  }

  /**
   * Prepare avatar update request data
   */
  static prepareUpdateRequest(
    originalImageUri: string,
    goalType: string,
    progressPercentage: number
  ) {
    return {
      imageUri: originalImageUri,
      progressPercentage,
      prompt: this.generateAvatarUpdatePrompt(goalType, progressPercentage),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Hook to use avatar update service
 * Usage in components:
 * const { updateAvatarOnGoalProgress } = useAvatarUpdateService();
 * await updateAvatarOnGoalProgress(avatarId, goalId, progressPercentage);
 */
export function useAvatarUpdateService() {
  const { updateAvatarWithProgress } = useAvatarUpdate();
  const { avatars } = useAvatars();

  const updateAvatarOnGoalProgress = async (
    avatarId: string,
    goalId: string,
    progressPercentage: number,
    goalType: string = 'default'
  ) => {
    try {
      // Find the avatar
      const avatar = avatars.find(a => a.id === avatarId);
      if (!avatar) {
        throw new Error('Avatar not found');
      }

      // Check if progress reached a milestone
      const milestone = AvatarUpdateService.getMilestonePercentage(progressPercentage);
      if (!milestone) {
        console.log('Progress has not reached a milestone yet');
        return null;
      }

      // Prepare the update request
      const updateRequest = AvatarUpdateService.prepareUpdateRequest(
        avatar.uri,
        goalType,
        milestone
      );

      // Call the update service
      const updatedImageUri = await updateAvatarWithProgress(
        avatarId,
        goalId,
        milestone,
        avatar.uri
      );

      return updatedImageUri;
    } catch (error) {
      console.error('Failed to update avatar on goal progress:', error);
      throw error;
    }
  };

  return { updateAvatarOnGoalProgress };
}
