import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_QUESTION_REMINDER_TIME = 'profileQuestionReminderTime';
const PROFILE_QUESTION_MUTED = 'profileQuestionMuted';
const PROFILE_QUESTION_COMPLETED = 'profileQuestionCompleted';
const ONBOARDING_COMPLETED = 'onboardingCompleted';
const PROFILE_QUESTION_SHOWN_AFTER_ONBOARDING = 'profileQuestionShownAfterOnboarding';

export const profileQuestionService = {
  // Check if we should show the profile question popup
  async shouldShowProfileQuestion(): Promise<boolean> {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(
        ONBOARDING_COMPLETED
      );
      const questionCompleted = await AsyncStorage.getItem(
        PROFILE_QUESTION_COMPLETED
      );
      const isMuted = await AsyncStorage.getItem(PROFILE_QUESTION_MUTED);
      const shownAfterOnboarding = await AsyncStorage.getItem(
        PROFILE_QUESTION_SHOWN_AFTER_ONBOARDING
      );

      // Don't show if already completed
      if (questionCompleted === 'true') {
        return false;
      }

      // Show if onboarding just completed and we haven't shown it yet
      if (onboardingCompleted === 'true' && shownAfterOnboarding !== 'true') {
        return true;
      }

      // Don't show if muted
      if (isMuted === 'true') {
        return false;
      }

      // Check if 24 hours have passed since "Ask Me Later"
      const reminderTime = await AsyncStorage.getItem(
        PROFILE_QUESTION_REMINDER_TIME
      );
      if (reminderTime) {
        const nextReminderTime = parseInt(reminderTime, 10);
        if (Date.now() >= nextReminderTime) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking profile question:', error);
      return false;
    }
  },

  // Mark that we've shown the popup after onboarding
  async markProfileQuestionShownAfterOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_QUESTION_SHOWN_AFTER_ONBOARDING, 'true');
    } catch (error) {
      console.error('Error marking profile question shown:', error);
    }
  },

  // Mark profile questions as completed
  async markProfileQuestionsCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_QUESTION_COMPLETED, 'true');
      await AsyncStorage.removeItem(PROFILE_QUESTION_REMINDER_TIME);
      await AsyncStorage.removeItem(PROFILE_QUESTION_MUTED);
    } catch (error) {
      console.error('Error marking profile questions completed:', error);
    }
  },

  // Mute the reminder (user clicks "Ask Me Later")
  async muteProfileQuestion(): Promise<void> {
    try {
      const nextReminderTime = Date.now() + 24 * 60 * 60 * 1000;
      await AsyncStorage.setItem(
        PROFILE_QUESTION_REMINDER_TIME,
        nextReminderTime.toString()
      );
      await AsyncStorage.setItem(PROFILE_QUESTION_MUTED, 'false');
      await AsyncStorage.setItem(PROFILE_QUESTION_SHOWN_AFTER_ONBOARDING, 'true');
    } catch (error) {
      console.error('Error muting profile question:', error);
    }
  },

  // Permanently mute the reminder
  async permanentlyMuteProfileQuestion(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_QUESTION_MUTED, 'true');
    } catch (error) {
      console.error('Error permanently muting profile question:', error);
    }
  },

  // Reset profile question (for testing or user request)
  async resetProfileQuestion(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_QUESTION_COMPLETED);
      await AsyncStorage.removeItem(PROFILE_QUESTION_REMINDER_TIME);
      await AsyncStorage.removeItem(PROFILE_QUESTION_MUTED);
      await AsyncStorage.removeItem(PROFILE_QUESTION_SHOWN_AFTER_ONBOARDING);
    } catch (error) {
      console.error('Error resetting profile question:', error);
    }
  },
};
