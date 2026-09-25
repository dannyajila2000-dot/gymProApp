import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const OPCIONES = [
  {
    valor: 'ninguna' as const,
    icono: 'body-outline' as const,
    titulo: 'No, estoy bien',
    descripcion: 'Puedo hacer cualquier tipo de ejercicio',
  },
  {
    valor: 'impacto_bajo' as const,
    icono: 'walk-outline' as const,
    titulo: 'Impacto bajo',
    descripcion: 'Apto para gente con sobrepeso',
  },
  {
    valor: 'sin_saltos' as const,
    icono: 'footsteps-outline' as const,
    titulo: 'Sin saltos',
    descripcion: 'Sin ruidos, apto para apartamentos',
  },
];

export default function Restricciones() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();

  return (
    <PasoOnboarding
      paso={6}
      titulo="¿Cuáles son tus preocupaciones físicas?"
      deshabilitado={!respuestas.restriccionFisica}
      onSiguiente={() => router.push('/onboarding/recordatorio')}>
      <View style={[styles.aviso, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.text }}>
          💊 Tu entrenador filtrará y reducirá los ejercicios que sean inadecuados para ti
        </Text>
      </View>

      {OPCIONES.map((op) => (
        <TarjetaOpcion
          key={op.valor}
          icono={op.icono}
          titulo={op.titulo}
          descripcion={op.descripcion}
          seleccionado={respuestas.restriccionFisica === op.valor}
          onPress={() => actualizar({ restriccionFisica: op.valor })}
        />
      ))}
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  aviso: {
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
});
