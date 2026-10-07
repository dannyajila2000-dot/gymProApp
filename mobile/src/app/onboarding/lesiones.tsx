import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipSeleccion } from '@/components/onboarding/chip-seleccion';
import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { useOnboarding, type ZonaLesion } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ZONAS } from '@/lib/onboarding-opciones';

export default function Lesiones() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const zonas = respuestas.zonasLesion;
  const sinLesiones = zonas.length === 0;

  function alternar(zona: ZonaLesion) {
    actualizar({ zonasLesion: zonas.includes(zona) ? zonas.filter((z) => z !== zona) : [...zonas, zona] });
  }

  return (
    <PasoOnboarding
      paso={10}
      titulo="¿Tienes alguna lesión o molestia?"
      desplazable
      onSiguiente={() => router.push('/onboarding/restricciones')}>
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.three }}>
        Toca la zona que te molesta (puedes elegir varias). Adaptamos tus ejercicios para cuidarla.
      </Text>

      <View style={styles.zonas}>
        {ZONAS.map((zona) => (
          <ChipSeleccion
            key={zona.valor}
            etiqueta={zona.etiqueta}
            icono={zona.icono}
            seleccionado={zonas.includes(zona.valor)}
            onPress={() => alternar(zona.valor)}
          />
        ))}
      </View>

      <Pressable
        onPress={() => actualizar({ zonasLesion: [] })}
        style={[
          styles.ninguna,
          {
            borderColor: sinLesiones ? colors.tintFondo : colors.border,
            backgroundColor: sinLesiones ? colors.backgroundElement : colors.background,
          },
        ]}>
        <Ionicons name={sinLesiones ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={sinLesiones ? colors.tint : colors.textSecondary} />
        <Text style={{ color: colors.text, fontWeight: '700' }}>No tengo ninguna lesión</Text>
      </Pressable>
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  zonas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  ninguna: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: Spacing.four,
  },
});
