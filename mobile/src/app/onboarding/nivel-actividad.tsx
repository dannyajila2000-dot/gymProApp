import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const NIVELES: { icono: keyof typeof Ionicons.glyphMap; texto: string }[] = [
  { icono: 'desktop-outline', texto: 'Paso el día en el escritorio' },
  { icono: 'walk-outline', texto: 'Me muevo o camino durante 30 minutos' },
  { icono: 'body-outline', texto: 'Entreno 1-2 veces por semana' },
  { icono: 'flame', texto: 'Hago ejercicio 3 o más veces por semana' },
];

export default function NivelActividad() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const nivel = NIVELES[respuestas.nivelActividad];

  return (
    <PasoOnboarding
      paso={2}
      titulo="¿Cuál es tu nivel de actividad?"
      onSiguiente={() => router.push('/onboarding/altura')}>
      <View style={styles.centro}>
        <View style={[styles.iconoCirculo, { backgroundColor: colors.backgroundElement }]}>
          <Ionicons name={nivel.icono} size={64} color={colors.tint} />
        </View>
        <Text style={[styles.texto, { color: colors.text }]}>{nivel.texto}</Text>
      </View>

      <View style={styles.sliderZona}>
        <Slider
          value={respuestas.nivelActividad}
          minimumValue={0}
          maximumValue={3}
          step={1}
          minimumTrackTintColor={colors.tint}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.tint}
          onValueChange={(valor) => actualizar({ nivelActividad: valor })}
        />
        <View style={styles.filaExtremos}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Sedentario</Text>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Activos</Text>
        </View>
      </View>
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  iconoCirculo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  sliderZona: {
    marginBottom: Spacing.five,
  },
  filaExtremos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
});
