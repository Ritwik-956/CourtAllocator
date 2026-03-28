/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2A9D8F';
const tintColorDark = '#2A9D8F';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#64748B',
    textInverse: '#FFFFFF',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    
    // Semantic Colors
    primary: '#2A9D8F',
    secondary: '#264653',
    accent: '#E9C46A',
    danger: '#E63946',
    warning: '#F4A261',
    success: '#2A9D8F',
    
    // UI Elements
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    inputBackground: '#F1F5F9',
    inputBorder: '#E2E8F0',
    
    // Transparent shades
    overlayLow: 'rgba(0,0,0,0.05)',
    overlayMed: 'rgba(0,0,0,0.1)',
    overlayHigh: 'rgba(0,0,0,0.2)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: 'rgba(255,255,255,0.5)',
    textInverse: '#11181C',
    background: '#0F1A2E',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    
    // Semantic Colors
    primary: '#2A9D8F',
    secondary: '#264653',
    accent: '#E9C46A',
    danger: '#E63946',
    warning: '#F4A261',
    success: '#2A9D8F',
    
    // UI Elements
    card: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.08)',
    inputBackground: 'rgba(255,255,255,0.08)',
    inputBorder: 'rgba(255,255,255,0.12)',
    
    // Transparent shades
    overlayLow: 'rgba(255,255,255,0.05)',
    overlayMed: 'rgba(255,255,255,0.1)',
    overlayHigh: 'rgba(255,255,255,0.2)',
  },
};

export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
