import React, { createContext, useContext, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isDarkMode, setIsDarkModeState] = useState(true);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setIsDarkModeState(mode === 'light' ? false : true);
  };

  const value = useMemo(() => ({ themeMode, setThemeMode, isDarkMode }), [themeMode, isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
