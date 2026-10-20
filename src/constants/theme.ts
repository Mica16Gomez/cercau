// Identidad natural contemporánea. Cada color expresa una función en la interfaz.

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#263A32',
    background: '#F8F4EA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DDE8DF',
    textSecondary: '#68766F',
    textSecondaryStrong: '#606E67', // Texto pequeño sobre crema; la base se conserva sobre blanco.
    primary: '#285B47',
    onPrimary: '#FFFFFF',
    primarySoft: '#DDE8DF',
    border: '#D9DED7',
    action: '#E47B3C',
    actionText: '#A44818',
    onAction: '#1F3028',
    error: '#B6523A',
    errorBackground: '#FFF7F3',
    star: '#E47B3C',
    favorite: '#A44818',
    open: '#245C45',
    openBackground: '#DDE8DF',
    closed: '#76573C',
    closedBackground: '#F4E8D7',
    promotion: '#A44818',
    promotionBackground: '#FBEBDD',
    forest: '#285B47',
    onForest: '#FFFFFF',
    buttonBackground: '#E47B3C',
    sage: '#DDE8DF',
    terracotta: '#E47B3C',
    terracottaSoft: '#FBEBDD',
    mustard: '#E47B3C',
    tabBackground: '#FFFFFF',
    overlay: '#173F35AA',
  },
  dark: {
    text: '#F8F4EA',
    background: '#17271F',
    backgroundElement: '#23382D',
    backgroundSelected: '#2B4B3B',
    textSecondary: '#B6CBBE',
    textSecondaryStrong: '#B6CBBE',
    primary: '#B7DEC7',
    onPrimary: '#173F35',
    primarySoft: '#2B4B3B',
    border: '#3E5B4B',
    action: '#E47B3C',
    actionText: '#F4AE7E',
    onAction: '#1F3028',
    error: '#F2A18B',
    errorBackground: '#50372D',
    star: '#E47B3C',
    favorite: '#F4AE7E',
    open: '#B7DEC7',
    openBackground: '#2B4B3B',
    closed: '#E8C4A2',
    closedBackground: '#493C2D',
    promotion: '#F4AE7E',
    promotionBackground: '#493729',
    forest: '#285B47',
    onForest: '#FFFFFF',
    buttonBackground: '#E47B3C',
    sage: '#DDE8DF',
    terracotta: '#E47B3C',
    terracottaSoft: '#50372D',
    mustard: '#E47B3C',
    tabBackground: '#1B352B',
    overlay: '#0B1712BB',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  page: 20,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = { field: 16, card: 20, large: 24, pill: 999 } as const;
export const Typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.7 },
  section: { fontSize: 20, lineHeight: 27, fontWeight: '700' as const, letterSpacing: -0.4 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '600' as const },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
