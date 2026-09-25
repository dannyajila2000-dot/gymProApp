import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { ReglaVertical } from '@/components/onboarding/regla-vertical';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const MIN_CM = 140;
const MAX_CM = 220;

function cmAPiesPulgadas(cm: number) {
  const pulgadasTotales = cm / 2.54;
  const pies = Math.floor(pulgadasTotales / 12);
  const pulgadas = Math.round(pulgadasTotales % 12);
  return `${pies}'${pulgadas}"`;
}

export default function Altura() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const [unidad, setUnidad] = useState<'cm' | 'ft'>('cm');

  const escala = 0.55 + ((respuestas.alturaCm - MIN_CM) / (MAX_CM - MIN_CM)) * 0.85;

  return (
    <PasoOnboarding paso={3} titulo="¿Cuál es tu altura?" onSiguiente={() => router.push('/onboarding/peso-actual')}>
      <View style={styles.toggleFila}>
        <Pressable
          onPress={() => setUnidad('cm')}
          style={[styles.toggleBoton, { backgroundColor: unidad === 'cm' ? colors.tint : colors.backgroundElement }]}>
          <Text style={{ color: unidad === 'cm' ? colors.tintForeground : colors.textSecondary, fontWeight: '700' }}>
            cm
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setUnidad('ft')}
          style={[styles.toggleBoton, { backgroundColor: unidad === 'ft' ? colors.tint : colors.backgroundElement }]}>
          <Text style={{ color: unidad === 'ft' ? colors.tintForeground : colors.textSecondary, fontWeight: '700' }}>
            ft
          </Text>
        </Pressable>
      </View>

      <View style={styles.valorFila}>
        <Text style={[styles.valor, { color: colors.text }]}>
          {unidad === 'cm' ? Math.round(respuestas.alturaCm) : cmAPiesPulgadas(respuestas.alturaCm)}
        </Text>
        {unidad === 'cm' && <Text style={{ color: colors.textSecondary, fontSize: 16 }}> cm</Text>}
      </View>

      <View style={styles.filaRegla}>
        <View style={styles.siluetaZona}>
          <View style={[styles.lineaSuelo, { backgroundColor: colors.border }]} />
          <View style={[styles.siluetaWrap, { transform: [{ scale: escala }] }]}>
            <Ionicons name="body" size={120} color={colors.tint} />
          </View>
        </View>

        <ReglaVertical
          valor={respuestas.alturaCm}
          minimo={MIN_CM}
          maximo={MAX_CM}
          paso={1}
          pasoMayor={10}
          onCambiar={(valor) => actualizar({ alturaCm: valor })}
        />
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
    marginBottom: Spacing.three,
  },
  toggleBoton: {
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  valorFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  valor: {
    fontSize: 44,
    fontWeight: '800',
  },
  filaRegla: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  siluetaZona: {
    flex: 1,
    height: 320,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lineaSuelo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  siluetaWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
