import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface Props {
  etiqueta: string;
  seleccionado: boolean;
  onPress: () => void;
  icono?: keyof typeof Ionicons.glyphMap;
  deshabilitado?: boolean;
}

/** Botón en forma de píldora para elegir una o varias opciones cortas (días de la semana, zonas del cuerpo). */
export function ChipSeleccion({ etiqueta, seleccionado, onPress, icono, deshabilitado }: Props) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado, disabled: deshabilitado }}
      style={[
        styles.chip,
        {
          backgroundColor: seleccionado ? colors.tintFondo : colors.backgroundElement,
          borderColor: seleccionado ? colors.tintFondo : colors.border,
          opacity: deshabilitado && !seleccionado ? 0.55 : 1,
        },
      ]}>
      {icono && <Ionicons name={icono} size={18} color={seleccionado ? colors.tintForeground : colors.text} />}
      <Text style={[styles.texto, { color: seleccionado ? colors.tintForeground : colors.text }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    minHeight: 46,
  },
  texto: {
    fontSize: 14,
    fontWeight: '700',
  },
});
