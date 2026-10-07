import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EntrenadorIlustracion } from '@/components/onboarding/entrenador-ilustracion';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function Saludo() {
  const colors = useTheme();
  const { cliente } = useSesion();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.atras}>
        <Ionicons name="arrow-back" size={26} color={colors.text} />
      </Pressable>

      <EntrenadorIlustracion ancho={210} />

      <View style={[styles.globo, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.titulo, { color: colors.text }]}>
          ¡Hola{cliente?.nombres ? `, ${cliente.nombres}` : ''}!
        </Text>
        <Text style={[styles.texto, { color: colors.textSecondary }]}>
          Soy tu entrenador. Vamos a empezar con una pequeña encuesta para conocerte y encontrar los{' '}
          <Text style={{ color: colors.tint, fontWeight: '800' }}>entrenamientos que mejor van contigo</Text> y con
          tus objetivos.
        </Text>
        <View style={styles.tiempo}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Te toma menos de 2 minutos</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/onboarding/objetivo')}
        accessibilityRole="button"
        style={[styles.boton, { backgroundColor: colors.tintFondo }]}>
        <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>¡VAMOS!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  atras: {
    position: 'absolute',
    top: Spacing.six,
    left: Spacing.four,
    zIndex: 1,
  },
  globo: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  tiempo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  boton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 16,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
