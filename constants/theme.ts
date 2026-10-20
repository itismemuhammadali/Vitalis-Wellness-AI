/**
 * KYVO App Theme Colors
 * Dark and Light mode color definitions
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#f5f5f5',
    text: '#1a1a1a',
    textSecondary: '#666666',
    primary: '#7eff00',
    primaryDark: '#5fb800',
    accent: '#00d4ff',
    inputBackground: '#ffffff',
    inputBorder: '#e0e0e0',
    inputText: '#333333',
    inputPlaceholder: '#999999',
    buttonText: '#000000',
    linkText: '#7eff00',
    settingsIconBorder: '#7eff00',
  },
  dark: {
    background: '#0a0e27',
    text: '#ffffff',
    textSecondary: '#999999',
    primary: '#7eff00',
    primaryDark: '#5fb800',
    accent: '#00d4ff',
    inputBackground: '#1a1f3a',
    inputBorder: '#2a3050',
    inputText: '#ffffff',
    inputPlaceholder: '#888888',
    buttonText: '#000000',
    linkText: '#7eff00',
    settingsIconBorder: '#7eff00',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
