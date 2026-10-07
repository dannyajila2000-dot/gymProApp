import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BotonOnboarding } from '@/components/onboarding/boton-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Primera pantalla de quien aún no tiene plan: una semana vacía y la invitación a crearlo. */
export default function SinEntrenamientos() {
  const colors = useTheme();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={styles.semana} accessibilityLabel="Tu semana está vacía">
        {DIAS.map((dia) => (
          <View key={dia} style={styles.dia}>
            <View style={[styles.circuloVacio, { borderColor: colors.border }]} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{dia}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.icono, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name="calendar-outline" size={54} color={colors.tint} />
      </View>

      <Text style={[styles.titulo, { color: colors.text }]}>Aún no tienes entrenamientos</Text>
      <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
        Tu semana está vacía. Crea un plan hecho a tu medida en pocos minutos y empieza a entrenar hoy.
      </Text>

      <BotonOnboarding onPress={() => router.push('/onboarding/saludo')} fondo={colors.tintFondo} style={styles.boton}>
        <Ionicons name="add-circle" size={22} color={colors.tintForeground} />
        <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>Crear mi plan</Text>
      </BotonOnboarding>
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
  semana: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.four,
  },
  dia: {
    alignItems: 'center',
    gap: 6,
  },
  circuloVacio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  icono: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  subtitulo: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 17,
    paddingHorizontal: Spacing.five,
    borderRadius: 16,
    marginTop: Spacing.four,
    alignSelf: 'stretch',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '800',
  },
});
