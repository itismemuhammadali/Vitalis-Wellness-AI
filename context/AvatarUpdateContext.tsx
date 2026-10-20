import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useMemo, useState } from 'react';

export interface AvatarUpdate {
  id: string;
  originalAvatarId: string;
  updatedImageUri: string;
  goalId: string;
  progressPercentage: number;
  createdAt: string;
}

export interface ProfilePicture {
  type: 'avatar' | 'custom';
  avatarId?: string;
  customUri?: string;
}

interface AvatarUpdateContextType {
  avatarUpdates: AvatarUpdate[];
  profilePicture: ProfilePicture | null;
  updateAvatarWithProgress: (
    originalAvatarId: string,
    goalId: string,
    progressPercentage: number,
    originalImageUri: string
  ) => Promise<string>;
  setProfilePictureFromAvatar: (avatarId: string) => Promise<void>;
  setProfilePictureCustom: (uri: string) => Promise<void>;
  getProfilePictureUri: () => Promise<string | null>;
  loadAvatarUpdates: () => Promise<void>;
  loadProfilePicture: () => Promise<void>;
  deleteAvatarUpdate: (id: string) => Promise<void>;
}

const AvatarUpdateContext = createContext<AvatarUpdateContextType | undefined>(undefined);

export function AvatarUpdateProvider({ children }: { children: React.ReactNode }) {
  const [avatarUpdates, setAvatarUpdates] = useState<AvatarUpdate[]>([]);
  const [profilePicture, setProfilePictureState] = useState<ProfilePicture | null>(null);

  const loadAvatarUpdates = async () => {
    try {
      const stored = await AsyncStorage.getItem('avatarUpdates');
      if (stored) {
        setAvatarUpdates(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load avatar updates:', error);
    }
  };

  const loadProfilePicture = async () => {
    try {
      const stored = await AsyncStorage.getItem('profilePicture');
      if (stored) {
        setProfilePictureState(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load profile picture:', error);
    }
  };

  const updateAvatarWithProgress = async (
    originalAvatarId: string,
    goalId: string,
    progressPercentage: number,
    originalImageUri: string
  ): Promise<string> => {
    try {
      // Call OpenAI API to generate updated avatar
      const updatedImageUri = await generateUpdatedAvatarImage(
        originalImageUri,
        progressPercentage
      );

      const newUpdate: AvatarUpdate = {
        id: Date.now().toString(),
        originalAvatarId,
        updatedImageUri,
        goalId,
        progressPercentage,
        createdAt: new Date().toISOString(),
      };

      const updated = [newUpdate, ...avatarUpdates];
      setAvatarUpdates(updated);

      try {
        await AsyncStorage.setItem('avatarUpdates', JSON.stringify(updated));
      } catch {
        console.warn('Failed to persist avatar updates');
      }

      return updatedImageUri;
    } catch (error) {
      console.error('Failed to update avatar with progress:', error);
      throw error;
    }
  };

  const setProfilePictureFromAvatar = async (avatarId: string) => {
    try {
      const newProfilePicture: ProfilePicture = {
        type: 'avatar',
        avatarId,
      };
      setProfilePictureState(newProfilePicture);

      try {
        await AsyncStorage.setItem('profilePicture', JSON.stringify(newProfilePicture));
      } catch {
        console.warn('Failed to persist profile picture');
      }
    } catch (error) {
      console.error('Failed to set profile picture from avatar:', error);
      throw error;
    }
  };

  const setProfilePictureCustom = async (uri: string) => {
    try {
      const newProfilePicture: ProfilePicture = {
        type: 'custom',
        customUri: uri,
      };
      setProfilePictureState(newProfilePicture);

      try {
        await AsyncStorage.setItem('profilePicture', JSON.stringify(newProfilePicture));
      } catch {
        console.warn('Failed to persist profile picture');
      }
    } catch (error) {
      console.error('Failed to set custom profile picture:', error);
      throw error;
    }
  };

  const getProfilePictureUri = async (): Promise<string | null> => {
    try {
      if (!profilePicture) {
        return null;
      }

      if (profilePicture.type === 'custom' && profilePicture.customUri) {
        return profilePicture.customUri;
      }

      if (profilePicture.type === 'avatar' && profilePicture.avatarId) {
        // Get the avatar URI from AvatarContext
        // This will be handled by the component using both contexts
        return profilePicture.avatarId;
      }

      return null;
    } catch (error) {
      console.error('Failed to get profile picture URI:', error);
      return null;
    }
  };

  const deleteAvatarUpdate = async (id: string) => {
    try {
      const updated = avatarUpdates.filter(a => a.id !== id);
      setAvatarUpdates(updated);

      try {
        await AsyncStorage.setItem('avatarUpdates', JSON.stringify(updated));
      } catch {
        console.warn('Failed to persist avatar updates after deletion');
      }
    } catch (error) {
      console.error('Failed to delete avatar update:', error);
      throw error;
    }
  };

  return (
    <AvatarUpdateContext.Provider
      value={useMemo(() => ({
        avatarUpdates,
        profilePicture,
        updateAvatarWithProgress,
        setProfilePictureFromAvatar,
        setProfilePictureCustom,
        getProfilePictureUri,
        loadAvatarUpdates,
        loadProfilePicture,
        deleteAvatarUpdate,
      }), [avatarUpdates, profilePicture, updateAvatarWithProgress, setProfilePictureFromAvatar, setProfilePictureCustom, getProfilePictureUri, loadAvatarUpdates, loadProfilePicture, deleteAvatarUpdate])}
    >
      {children}
    </AvatarUpdateContext.Provider>
  );
}

export function useAvatarUpdate() {
  const context = useContext(AvatarUpdateContext);
  if (!context) {
    throw new Error('useAvatarUpdate must be used within AvatarUpdateProvider');
  }
  return context;
}

// Helper function to call OpenAI API for avatar generation
async function generateUpdatedAvatarImage(
  originalImageUri: string,
  progressPercentage: number
): Promise<string> {
  try {
    // This is a placeholder - in production, you'd call your backend API
    // which would then call OpenAI with the image and progress details
    
    const response = await fetch('YOUR_BACKEND_API_ENDPOINT/generate-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_API_KEY`,
      },
      body: JSON.stringify({
        imageUri: originalImageUri,
        progressPercentage,
        prompt: `Update this person's appearance to reflect ${progressPercentage}% progress on their fitness goal. Make subtle but visible changes.`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate updated avatar');
    }

    const data = await response.json();
    return data.imageUri;
  } catch (error) {
    console.error('Error generating updated avatar:', error);
    throw error;
  }
}
