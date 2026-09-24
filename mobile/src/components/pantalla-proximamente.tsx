import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function PantallaProximamente({
  icono,
  titulo,
  descripcion,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
}) {
  const colors = useTheme();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={[styles.circulo, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name={icono} size={36} color={colors.tint} />
      </View>
      <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
      <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{descripcion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.three,
  },
  circulo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
  },
  descripcion: {
    fontSize: 14,
    textAlign: 'center',
  },
});
