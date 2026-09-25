import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { ReglaHorizontal } from '@/components/onboarding/regla-horizontal';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { calcularImc, categoriaImc } from '@/lib/imc';

const MIN_KG = 35;
const MAX_KG = 180;

function mensajeImc(imc: number) {
  if (imc < 18.5) return 'Puedes ganar algo de peso de forma saludable.';
  if (imc < 25) return '¡Ya estás en un rango saludable, sigue así!';
  if (imc < 30) return '¡Solo tienes que sudar un poco más para ponerte más en forma!';
  return 'Vamos a trabajar juntos para bajar ese IMC.';
}

export default function PesoActual() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');

  const imc = calcularImc(respuestas.pesoActualKg, respuestas.alturaCm);
  const valorMostrado =
    unidad === 'kg' ? respuestas.pesoActualKg.toFixed(1) : (respuestas.pesoActualKg * 2.20462).toFixed(1);

  return (
    <PasoOnboarding
      paso={4}
      titulo="¿Cuánto pesas actualmente?"
      onSiguiente={() => router.push('/onboarding/peso-objetivo')}>
      <View style={styles.toggleFila}>
        <Pressable
          onPress={() => setUnidad('kg')}
          style={[styles.toggleBoton, { backgroundColor: unidad === 'kg' ? colors.tint : colors.backgroundElement }]}>
          <Text style={{ color: unidad === 'kg' ? colors.tintForeground : colors.textSecondary, fontWeight: '700' }}>
            kg
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setUnidad('lb')}
          style={[styles.toggleBoton, { backgroundColor: unidad === 'lb' ? colors.tint : colors.backgroundElement }]}>
          <Text style={{ color: unidad === 'lb' ? colors.tintForeground : colors.textSecondary, fontWeight: '700' }}>
            lb
          </Text>
        </Pressable>
      </View>

      <View style={styles.centro}>
        <Text style={[styles.valor, { color: colors.text }]}>
          {valorMostrado} <Text style={{ fontSize: 18, fontWeight: '600' }}>{unidad}</Text>
        </Text>
      </View>

      <ReglaHorizontal
        valor={respuestas.pesoActualKg}
        minimo={MIN_KG}
        maximo={MAX_KG}
        paso={1}
        pasoMayor={10}
        onCambiar={(valor) => actualizar({ pesoActualKg: valor })}
      />

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>TU IMC ACTUAL</Text>
        <View style={styles.filaImc}>
          <Text style={[styles.imcValor, { color: colors.tint }]}>{imc.toFixed(1)}</Text>
          <Text style={{ color: colors.textSecondary, flex: 1 }}>{mensajeImc(imc)}</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{categoriaImc(imc)}</Text>
      </View>
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  toggleFila: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  toggleBoton: {
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    fontSize: 48,
    fontWeight: '800',
  },
  tarjeta: {
    borderRadius: 18,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
  filaImc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  imcValor: {
    fontSize: 30,
    fontWeight: '800',
  },
});
