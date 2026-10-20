import React, { createContext, useContext, useState } from 'react';

interface OnboardingAvatarContextType {
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => void;
}

const OnboardingAvatarContext = createContext<OnboardingAvatarContextType | undefined>(undefined);

export function OnboardingAvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  return (
    <OnboardingAvatarContext.Provider value={{ avatarUri, setAvatarUri }}>
      {children}
    </OnboardingAvatarContext.Provider>
  );
}

export function useOnboardingAvatar() {
  const context = useContext(OnboardingAvatarContext);
  if (!context) {
    throw new Error('useOnboardingAvatar must be used within OnboardingAvatarProvider');
  }
  return context;
}
