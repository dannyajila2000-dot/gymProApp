import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

/** Aviso en el inicio cuando la membresía está por vencer (7 días o menos). No aparece en ningún otro caso. */
export function AvisoMembresia() {
  const colors = useTheme();
  const { cliente } = useSesion();
  const membresia = cliente?.membresia;
  if (!membresia || membresia.estado !== 'por_vencer') return null;

  const dias = membresia.diasRestantes ?? 0;
  const cuando = dias <= 0 ? 'vence hoy' : dias === 1 ? 'vence mañana' : `vence en ${dias} días`;

  return (
    <View style={[styles.aviso, { backgroundColor: colors.backgroundSelected }]} accessibilityRole="alert">
      <Ionicons name="time-outline" size={22} color={colors.tint} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>Tu membresía {cuando}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Renuévala en tu gimnasio para no quedarte sin entrenar.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
  },
});
