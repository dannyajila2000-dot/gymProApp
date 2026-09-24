import { StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function Inicio() {
  const colors = useTheme();
  const { cliente } = useSesion();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <Text style={[styles.saludo, { color: colors.text }]}>Hola, {cliente?.nombres} 👋</Text>
      <Text style={[styles.gimnasio, { color: colors.textSecondary }]}>{cliente?.gimnasio}</Text>

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.tarjetaTitulo, { color: colors.text }]}>Próximamente aquí</Text>
        <Text style={{ color: colors.textSecondary }}>
          Resumen del día: tu rutina, próxima clase y estado de tu membresía.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  saludo: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: Spacing.five,
  },
  gimnasio: {
    fontSize: 15,
  },
  tarjeta: {
    marginTop: Spacing.four,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tarjetaTitulo: {
    fontSize: 16,
    fontWeight: '700',
  },
});
