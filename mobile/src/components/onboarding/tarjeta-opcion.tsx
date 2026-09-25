import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface Props {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  seleccionado: boolean;
  onPress: () => void;
}

export function TarjetaOpcion({ icono, titulo, descripcion, seleccionado, onPress }: Props) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tarjeta,
        {
          borderColor: seleccionado ? colors.tint : colors.border,
          backgroundColor: seleccionado ? colors.backgroundElement : colors.background,
        },
      ]}>
      <View style={[styles.iconoWrap, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name={icono} size={22} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{descripcion}</Text>
      </View>
      <View
        style={[
          styles.radio,
          {
            borderColor: seleccionado ? colors.tint : colors.border,
            backgroundColor: seleccionado ? colors.tint : 'transparent',
          },
        ]}>
        {seleccionado && <Ionicons name="checkmark" size={14} color={colors.tintForeground} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  iconoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
