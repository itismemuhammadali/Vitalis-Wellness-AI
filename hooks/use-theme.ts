import { Colors } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    colors,
    colorScheme,
  };
}
