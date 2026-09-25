/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#20352E',
    background: '#F7F8F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7EFE9',
    textSecondary: '#63716A',
    primary: '#24634D',
    onPrimary: '#FFFFFF',
    primarySoft: '#E7EFE9',
    border: '#DFE7DF',
    star: '#9B6517',
    favorite: '#B24A5B',
    open: '#286645',
    openBackground: '#EAF3EB',
    closed: '#786047',
    closedBackground: '#F4EDE4',
    promotion: '#865417',
    promotionBackground: '#FFF2DC',
  },
  dark: {
    text: '#EDF4EF',
    background: '#14201B',
    backgroundElement: '#1D2D25',
    backgroundSelected: '#304C3E',
    textSecondary: '#ACBDB2',
    primary: '#9FD9B7',
    onPrimary: '#173D2C',
    primarySoft: '#293F33',
    border: '#364B3E',
    star: '#F1C578',
    favorite: '#FFA9B8',
    open: '#AFE2BB',
    openBackground: '#2A4233',
    closed: '#E0C3A2',
    closedBackground: '#41382D',
    promotion: '#F3CF91',
    promotionBackground: '#403627',
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
