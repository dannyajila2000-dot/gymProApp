import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as progresoApi from '@/api/progreso';
import * as rutinasApi from '@/api/rutinas';
import type { DiaPlan, Rutina } from '@/api/rutinas';
import { useSesion } from '@/context/auth-context';
import { DIAS_NOMBRE } from '@/constants/dias';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function Inicio() {
  const colors = useTheme();
  const { cliente } = useSesion();

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [plan, setPlan] = useState<DiaPlan[]>([]);
  const [miRutina, setMiRutina] = useState<Rutina | null>(null);
  const [racha, setRacha] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const [semana, rutina, resumen] = await Promise.all([
        rutinasApi.obtenerPlanSemana(),
        rutinasApi.obtenerMiRutina(),
        progresoApi.resumenDeLaSemana(),
      ]);
      setPlan(semana);
      setMiRutina(rutina);
      setRacha(resumen.racha);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function comenzarHoy() {
    if (!miRutina) {
      router.push('/(tabs)/rutina');
      return;
    }
    router.push({ pathname: '/entrenamiento/[rutinaId]', params: { rutinaId: miRutina.id } });
  }

  if (cargando) {
    return (
      <View style={[styles.contenedorCentro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const hoyIndice = plan.findIndex((d) => d.esHoy);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.contenedor}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargar();
          }}
          tintColor={colors.tint}
        />
      }>
      <View style={styles.filaEncabezado}>
        <View>
          <Text style={[styles.saludo, { color: colors.text }]}>Hola, {cliente?.nombres} 👋</Text>
          <Text style={{ color: colors.textSecondary }}>{cliente?.gimnasio}</Text>
        </View>
        {racha > 0 && (
          <View style={[styles.rachaTarjeta, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="flame" size={18} color={colors.tint} />
            <Text style={{ color: colors.text, fontWeight: '800' }}>{racha}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>Tu semana</Text>

      <View style={styles.lineaTiempo}>
        {plan.map((dia, indice) => (
          <View key={dia.fecha} style={styles.filaDia}>
            <View style={styles.columnaMarcador}>
              <View
                style={[
                  styles.marcador,
                  dia.completado
                    ? { backgroundColor: colors.tint, borderColor: colors.tint }
                    : dia.esHoy
                      ? { backgroundColor: colors.background, borderColor: colors.tint }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                ]}>
                {dia.completado && <Ionicons name="checkmark" size={12} color={colors.tintForeground} />}
              </View>
              {indice < plan.length - 1 && <View style={[styles.lineaVertical, { backgroundColor: colors.border }]} />}
            </View>

            <DiaTarjeta dia={dia} miRutina={miRutina} onComenzar={comenzarHoy} colors={colors} />
          </View>
        ))}
      </View>

      {hoyIndice === -1 && (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.two }}>
          No pudimos ubicar el día de hoy en tu semana.
        </Text>
      )}
    </ScrollView>
  );
}

function DiaTarjeta({
  dia,
  miRutina,
  onComenzar,
  colors,
}: {
  dia: DiaPlan;
  miRutina: Rutina | null;
  onComenzar: () => void;
  colors: ReturnType<typeof useTheme>;
}) {
  const destacar = dia.esHoy && !dia.completado;

  if (!dia.esDiaEntrenamiento) {
    return (
      <View style={[styles.tarjetaDia, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.filaTarjeta}>
          <Ionicons name="cafe-outline" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {DIAS_NOMBRE[dia.diaSemana]} {dia.fecha.slice(8, 10)}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Día de descanso</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.tarjetaDia,
        destacar
          ? { backgroundColor: colors.tint }
          : dia.completado
            ? { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.tint }
            : { backgroundColor: colors.backgroundElement },
      ]}>
      <View style={styles.filaTarjeta}>
        <Ionicons
          name="barbell-outline"
          size={22}
          color={destacar ? colors.tintForeground : dia.completado ? colors.tint : colors.textSecondary}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: destacar ? colors.tintForeground : colors.text, fontWeight: '700' }}>
            {DIAS_NOMBRE[dia.diaSemana]} {dia.fecha.slice(8, 10)}
          </Text>
          <Text style={{ color: destacar ? colors.tintForeground : colors.textSecondary, fontSize: 12.5, opacity: destacar ? 0.9 : 1 }}>
            {dia.completado ? '¡Completado!' : (miRutina?.nombre ?? 'Día de entrenamiento')}
          </Text>
        </View>
      </View>
      {destacar && (
        <Pressable
          onPress={onComenzar}
          style={[styles.botonComenzar, { backgroundColor: colors.tintForeground }]}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Comenzar</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.tint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorCentro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: { padding: Spacing.four, paddingBottom: Spacing.six },
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.two,
  },
  saludo: { fontSize: 24, fontWeight: '800' },
  rachaTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  seccionTitulo: { fontSize: 18, fontWeight: '800', marginTop: Spacing.five, marginBottom: Spacing.two },
  lineaTiempo: { gap: 0 },
  filaDia: { flexDirection: 'row', gap: Spacing.two },
  columnaMarcador: { alignItems: 'center', width: 20 },
  marcador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineaVertical: { flex: 1, width: 2, marginVertical: 2 },
  tarjetaDia: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  filaTarjeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  botonComenzar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
  },
});
