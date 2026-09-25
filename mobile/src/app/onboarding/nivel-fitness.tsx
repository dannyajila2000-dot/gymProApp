import { router } from 'expo-router';
import { View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { Spacing } from '@/constants/theme';

const OPCIONES = [
  {
    valor: 'principiante' as const,
    icono: 'layers-outline' as const,
    titulo: 'Principiante',
    descripcion: 'Soy completamente nuevo en el fitness',
  },
  {
    valor: 'intermedio' as const,
    icono: 'layers' as const,
    titulo: 'Intermedio',
    descripcion: 'Tengo experiencia en fitness y estoy listo para progresar',
  },
  {
    valor: 'avanzado' as const,
    icono: 'trophy' as const,
    titulo: 'Avanzado',
    descripcion: 'Soy un entusiasta del fitness con experiencia en diversos tipos de entrenamiento',
  },
];

export default function NivelFitness() {
  const { respuestas, actualizar } = useOnboarding();

  return (
    <PasoOnboarding
      paso={1}
      titulo="¿Cuál es tu nivel de fitness?"
      deshabilitado={!respuestas.nivelFitness}
      onSiguiente={() => router.push('/onboarding/nivel-actividad')}>
      <View style={{ marginTop: Spacing.four }}>
        {OPCIONES.map((op) => (
          <TarjetaOpcion
            key={op.valor}
            icono={op.icono}
            titulo={op.titulo}
            descripcion={op.descripcion}
            seleccionado={respuestas.nivelFitness === op.valor}
            onPress={() => actualizar({ nivelFitness: op.valor })}
          />
        ))}
      </View>
    </PasoOnboarding>
  );
}
