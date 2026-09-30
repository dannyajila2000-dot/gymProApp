import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { SesionEntrenamiento } from '@/api/rutinas';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function Historial() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [sesiones, setSesiones] = useState<SesionEntrenamiento[]>([]);

  useFocusEffect(
    useCallback(() => {
      rutinasApi
        .obtenerHistorial()
        .then(setSesiones)
        .finally(() => setCargando(false));
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.titulo, { color: colors.text }]}>Historial</Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={colors.tint} size="large" style={{ marginTop: Spacing.five }} />
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {sesiones.map((sesion) => (
            <View key={sesion.id} style={[styles.fila, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{sesion.rutina.nombre}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  {new Date(sesion.completadaEn).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{sesion.duracionMin} min</Text>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>{Math.round(sesion.caloriasEstimadas)} kcal</Text>
            </View>
          ))}
          {sesiones.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.five }}>
              Aún no has completado entrenamientos.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
  },
  titulo: { fontSize: 22, fontWeight: '800' },
  lista: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
