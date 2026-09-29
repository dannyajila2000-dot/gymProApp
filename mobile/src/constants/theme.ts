/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    tint: '#2563EB',
    tintForeground: '#ffffff',
    border: '#E3E1DC',
    danger: '#B3402E',
    info: '#0D9488',
    infoForeground: '#ffffff',
    success: '#1FA971',
    warning: '#D9A62E',
    energia: '#5B4FE9',
    energiaOscuro: '#7C3AED',
    energiaSuave: '#EDEBFC',
  },
  dark: {
    text: '#ffffff',
    background: '#0B1220',
    backgroundElement: '#16213A',
    backgroundSelected: '#1E2B4A',
    textSecondary: '#9BA9C6',
    tint: '#5B9DFF',
    tintForeground: '#0B1730',
    border: '#22314F',
    danger: '#FF6B54',
    info: '#2DD4BF',
    infoForeground: '#052E2B',
    success: '#3FCB93',
    warning: '#F0C155',
    energia: '#7C74F0',
    energiaOscuro: '#9D5CF5',
    energiaSuave: '#241F45',
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

/** Sombra sutil para tarjetas — misma receta en toda la app en vez de planas. */
export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
  },
  default: {},
}) as object;
