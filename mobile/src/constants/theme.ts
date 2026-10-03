/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// El fondo blanco + dorado/negro se pide siempre, sin importar el tema del
// celular (Danny confirmó "blanco siempre" en vez de solo modo claro) —
// por eso `dark` es una copia idéntica de `light` en vez de una paleta
// oscura propia.
const paleta = {
  text: '#111111',
  background: '#ffffff',
  backgroundElement: '#F8F5EC',
  backgroundSelected: '#EFE6CC',
  textSecondary: '#6B6454',
  // Dorado oscuro: para texto e iconos sobre blanco (el dorado vivo no contrasta lo suficiente).
  tint: '#8A6A12',
  // Dorado vivo: para rellenos, bordes y controles activos; el texto encima usa tintForeground.
  tintFondo: '#C9A227',
  tintForeground: '#111111',
  border: '#E8E1CC',
  danger: '#B3402E',
  info: '#0D9488',
  infoForeground: '#ffffff',
  success: '#1FA971',
  warning: '#D9822B',
  energia: '#E6C24A',
  energiaOscuro: '#C9A227',
  energiaSuave: '#FBF3D9',
} as const;

export const Colors = {
  light: paleta,
  dark: paleta,
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

/** Sombra más marcada para las fotos recortadas que "flotan" fuera de la tarjeta. */
export const FotoFlotanteShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  android: {
    elevation: 12,
  },
  default: {},
}) as object;
