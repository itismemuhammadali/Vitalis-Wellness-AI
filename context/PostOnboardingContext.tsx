import React, { createContext, useContext, useMemo, useState } from 'react';

type NavigationSource = 'home' | 'profile';

interface PostOnboardingContextType {
  navigationSource: NavigationSource;
  setNavigationSource: (source: NavigationSource) => void;
}

const PostOnboardingContext = createContext<PostOnboardingContextType | undefined>(undefined);

export const PostOnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationSource, setNavigationSource] = useState<NavigationSource>('home');

  const value = useMemo(() => ({ navigationSource, setNavigationSource }), [navigationSource]);

  return (
    <PostOnboardingContext.Provider value={value}>
      {children}
    </PostOnboardingContext.Provider>
  );
};

export const usePostOnboarding = () => {
  const context = useContext(PostOnboardingContext);
  if (!context) {
    throw new Error('usePostOnboarding must be used within PostOnboardingProvider');
  }
  return context;
};
