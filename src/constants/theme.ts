// Identidad Barrio contemporáneo. Los colores por función también contemplan el tema oscuro.

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#173F35',
    background: '#FFF8E8',
    backgroundElement: '#FFFEFA',
    backgroundSelected: '#DCEADF',
    textSecondary: '#596D64',
    primary: '#2F735B',
    onPrimary: '#FFF8E8',
    primarySoft: '#DCEADF',
    border: '#E1E4D7',
    star: '#9A6515',
    favorite: '#A6402B',
    open: '#245C45',
    openBackground: '#DCEADF',
    closed: '#76573C',
    closedBackground: '#F4E8D7',
    promotion: '#795015',
    promotionBackground: '#FAEDC8',
    forest: '#173F35',
    onForest: '#FFF8E8',
    buttonBackground: '#2F735B',
    sage: '#DCEADF',
    terracotta: '#D96C4A',
    terracottaSoft: '#FBE4D9',
    mustard: '#E3A72F',
    tabBackground: '#FFFEFA',
    overlay: '#173F35AA',
  },
  dark: {
    text: '#FFF8E8',
    background: '#142B24',
    backgroundElement: '#203A30',
    backgroundSelected: '#2B4B3B',
    textSecondary: '#B6CBBE',
    primary: '#B7DEC7',
    onPrimary: '#173F35',
    primarySoft: '#2B4B3B',
    border: '#3E5B4B',
    star: '#F0C66D',
    favorite: '#F3B29C',
    open: '#B7DEC7',
    openBackground: '#2B4B3B',
    closed: '#E8C4A2',
    closedBackground: '#493C2D',
    promotion: '#F0C66D',
    promotionBackground: '#493E24',
    forest: '#173F35',
    onForest: '#FFF8E8',
    buttonBackground: '#2F735B',
    sage: '#DCEADF',
    terracotta: '#D96C4A',
    terracottaSoft: '#50372D',
    mustard: '#E3A72F',
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
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
