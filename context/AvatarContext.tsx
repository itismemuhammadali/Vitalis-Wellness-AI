import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface Avatar {
  id: string;
  uri: string;
  createdAt: string;
}

interface AvatarContextType {
  avatars: Avatar[];
  addAvatar: (uri: string) => Promise<string>;
  deleteAvatar: (id: string) => Promise<void>;
  loadAvatars: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const stored = await AsyncStorage.getItem('avatars');
      if (stored) {
        setAvatars(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load avatars:', error);
    }
  };

  const addAvatar = async (uri: string): Promise<string> => {
    try {
      const newAvatar: Avatar = {
        id: Date.now().toString(),
        uri,
        createdAt: new Date().toISOString(),
      };

      const updated = [newAvatar, ...avatars];
      setAvatars(updated);

      try {
        await AsyncStorage.setItem('avatars', JSON.stringify(updated));
      } catch {
        console.warn('Failed to persist avatars');
      }

      return newAvatar.id;
    } catch (error) {
      console.error('Failed to add avatar:', error);
      throw error;
    }
  };

  const deleteAvatar = async (id: string) => {
    try {
      const updated = avatars.filter(a => a.id !== id);
      setAvatars(updated);

      try {
        await AsyncStorage.setItem('avatars', JSON.stringify(updated));
      } catch {
        console.warn('Failed to persist avatars after deletion');
      }
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      throw error;
    }
  };

  return (
    <AvatarContext.Provider
      value={useMemo(() => ({
        avatars,
        addAvatar,
        deleteAvatar,
        loadAvatars,
      }), [avatars, addAvatar, deleteAvatar, loadAvatars])}
    >
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatars() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatars must be used within AvatarProvider');
  }
  return context;
}
