import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

interface Props {
  onPress: () => void;
  fondo: string;
  deshabilitado?: boolean;
  /** Mientras la pantalla cambia: el botón se ve atenuado como señal de que ya se pulsó. */
  atenuado?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Botón grande del onboarding. Usa el Pressable de react-native-gesture-handler, que reconoce el toque
 * en el sistema nativo sobre todo el rectángulo del botón; el de React Native respondía solo al tocar
 * justo el texto en algunos Android. Además agranda un poco la zona tocable (hitSlop).
 */
export function BotonOnboarding({ onPress, fondo, deshabilitado, atenuado, style, children }: PropsWithChildren<Props>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!deshabilitado }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fondo, opacity: deshabilitado ? 0.4 : atenuado || pressed ? 0.75 : 1 },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
});
