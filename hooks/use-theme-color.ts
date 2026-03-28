import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Custom hook to get theme colors based on the current color scheme.
 */
export function useThemeColor() {
  const colorScheme = useColorScheme() ?? 'light';
  return Colors[colorScheme];
}

/**
 * Hook to get a specific color by name for the current theme.
 */
export function useColor(colorName: keyof ThemeColors) {
  const theme = useThemeColor();
  return theme[colorName];
}
