import { router } from 'expo-router';
import { View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { HISTORIAL } from '@/lib/onboarding-opciones';

export default function Historial() {
  const { respuestas, actualizar } = useOnboarding();

  return (
    <PasoOnboarding
      paso={3}
      titulo="Durante los últimos 3 meses, ¿cuánto entrenaste?"
      desplazable
      deshabilitado={respuestas.historialEntrenamiento === null}
      onSiguiente={() => router.push('/onboarding/nivel-actividad')}>
      <View>
        {HISTORIAL.map((op) => (
          <TarjetaOpcion
            key={op.valor}
            icono={op.icono}
            titulo={op.titulo}
            descripcion={op.descripcion}
            seleccionado={respuestas.historialEntrenamiento === op.valor}
            onPress={() => actualizar({ historialEntrenamiento: op.valor })}
          />
        ))}
      </View>
    </PasoOnboarding>
  );
}
