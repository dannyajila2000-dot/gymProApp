import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { ReglaHorizontal } from '@/components/onboarding/regla-horizontal';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { calcularImc } from '@/lib/imc';

const MIN_KG = 35;
const MAX_KG = 180;

function evaluarObjetivo(pesoActualKg: number, pesoObjetivoKg: number, alturaCm: number) {
  const imcObjetivo = calcularImc(pesoObjetivoKg, alturaCm);
  const porcentaje = ((pesoObjetivoKg - pesoActualKg) / pesoActualKg) * 100;
  const perdiendo = pesoObjetivoKg < pesoActualKg;

  if (imcObjetivo < 18.5 || imcObjetivo >= 30) {
    return {
      tipo: 'atencion' as const,
      icono: 'warning' as const,
      color: '#D64545',
      titulo: '¡ATENCIÓN!',
      texto: `Parece que tu IMC objetivo es demasiado ${imcObjetivo >= 30 ? 'alto' : 'bajo'}, lo que puede provocar problemas de salud.`,
    };
  }

  if (Math.abs(porcentaje) >= 10) {
    return {
      tipo: 'reto' as const,
      icono: 'flame' as const,
      color: '#E8792A',
      titulo: '¡UN RETO CONSIDERABLE!',
      texto: `${perdiendo ? 'Perderás' : 'Ganarás'} un ${Math.abs(porcentaje).toFixed(1)}% de peso corporal.\n\nObservarás beneficios para tu salud considerables:\n- Mejora la salud cardiovascular\n- Reduce el riesgo de enfermedades crónicas`,
    };
  }

  return {
    tipo: 'razonable' as const,
    icono: 'thumbs-up' as const,
    color: '#2FA36B',
    titulo: '¡OBJETIVO RAZONABLE!',
    texto: `${perdiendo ? 'Perderás' : 'Ganarás'} un ${Math.abs(porcentaje).toFixed(1)}% de peso corporal.\n\nUn cambio moderado puede suponer una gran diferencia:\n- Menor presión sanguínea\n- Reduce el riesgo de diabetes tipo 2`,
  };
}

export default function PesoObjetivo() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');

  const evaluacion = evaluarObjetivo(respuestas.pesoActualKg, respuestas.pesoObjetivoKg, respuestas.alturaCm);

  function formatear(kg: number) {
    return unidad === 'kg' ? kg.toFixed(1) : (kg * 2.20462).toFixed(1);
  }

  return (
    <PasoOnboarding
      paso={5}
      titulo="¿Cuál es tu peso objetivo?"
      onSiguiente={() => router.push('/onboarding/restricciones')}>
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
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>{formatear(respuestas.pesoActualKg)} →</Text>
        <Text style={[styles.valor, { color: evaluacion.color }]}>
          {formatear(respuestas.pesoObjetivoKg)} <Text style={{ fontSize: 18, fontWeight: '600' }}>{unidad}</Text>
        </Text>
      </View>

      <ReglaHorizontal
        valor={respuestas.pesoObjetivoKg}
        minimo={MIN_KG}
        maximo={MAX_KG}
        paso={1}
        pasoMayor={10}
        colorIndicador={evaluacion.color}
        onCambiar={(valor) => actualizar({ pesoObjetivoKg: valor })}
      />

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement, marginTop: Spacing.four }]}>
        <View style={styles.filaTitulo}>
          <Ionicons name={evaluacion.icono} size={18} color={evaluacion.color} />
          <Text style={[styles.tituloTarjeta, { color: evaluacion.color }]}>{evaluacion.titulo}</Text>
        </View>
        <Text style={{ color: colors.text, lineHeight: 20 }}>{evaluacion.texto}</Text>
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
    fontSize: 40,
    fontWeight: '800',
  },
  tarjeta: {
    borderRadius: 18,
    padding: Spacing.three,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.one,
  },
  tituloTarjeta: {
    fontWeight: '800',
    fontSize: 13,
  },
});
