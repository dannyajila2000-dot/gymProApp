import { router } from 'expo-router';
import { View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { CONOCIMIENTO } from '@/lib/onboarding-opciones';

export default function NivelFitness() {
  const { respuestas, actualizar } = useOnboarding();

  return (
    <PasoOnboarding
      paso={2}
      titulo="¿Qué tanto sabes de entrenar en un gimnasio?"
      desplazable
      deshabilitado={!respuestas.nivelFitness}
      onSiguiente={() => router.push('/onboarding/historial')}>
      <View>
        {CONOCIMIENTO.map((op) => (
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
