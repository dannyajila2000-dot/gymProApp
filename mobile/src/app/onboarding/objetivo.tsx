import { router } from 'expo-router';
import { View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { OBJETIVOS } from '@/lib/onboarding-opciones';

export default function Objetivo() {
  const { respuestas, actualizar } = useOnboarding();

  return (
    <PasoOnboarding
      paso={1}
      titulo="¿Cuál es tu objetivo principal?"
      desplazable
      deshabilitado={!respuestas.objetivoPrincipal}
      onSiguiente={() => router.push('/onboarding/nivel-fitness')}>
      <View>
        {OBJETIVOS.map((op) => (
          <TarjetaOpcion
            key={op.valor}
            icono={op.icono}
            titulo={op.titulo}
            descripcion={op.descripcion}
            seleccionado={respuestas.objetivoPrincipal === op.valor}
            onPress={() => actualizar({ objetivoPrincipal: op.valor })}
          />
        ))}
      </View>
    </PasoOnboarding>
  );
}
