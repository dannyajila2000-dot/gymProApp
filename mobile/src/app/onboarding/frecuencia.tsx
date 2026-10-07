import { router } from 'expo-router';
import { View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { DIAS_SUGERIDOS, FRECUENCIAS } from '@/lib/onboarding-opciones';

export default function Frecuencia() {
  const { respuestas, actualizar } = useOnboarding();

  return (
    <PasoOnboarding
      paso={5}
      titulo="¿Cuántas veces por semana quieres entrenar?"
      desplazable
      deshabilitado={!respuestas.frecuenciaSemanal}
      onSiguiente={() => router.push('/onboarding/dias-horario')}>
      <View>
        {FRECUENCIAS.map((op) => (
          <TarjetaOpcion
            key={op.valor}
            icono={op.icono}
            titulo={op.titulo}
            descripcion={op.descripcion}
            seleccionado={respuestas.frecuenciaSemanal === op.valor}
            onPress={() => {
              // Al cambiar la frecuencia, los días se sugieren de nuevo para que cuadren con la cantidad.
              if (respuestas.frecuenciaSemanal !== op.valor) {
                actualizar({ frecuenciaSemanal: op.valor, diasEntrenamiento: DIAS_SUGERIDOS[op.valor] });
              }
            }}
          />
        ))}
      </View>
    </PasoOnboarding>
  );
}
