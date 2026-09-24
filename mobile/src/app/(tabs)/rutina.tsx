import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import * as rutinasApi from '@/api/rutinas';
import type { Rutina as RutinaModelo, SesionEntrenamiento } from '@/api/rutinas';

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function duracionEstimadaMin(rutina: RutinaModelo) {
  const segundos = rutina.ejercicios.reduce((suma, item) => {
    const trabajo = item.duracionSeg ?? (item.repeticiones ?? 10) * 3;
    const series = item.series ?? 1;
    return suma + trabajo * series + (item.descansoSeg ?? 20) * series;
  }, 0);
  return Math.max(1, Math.round(segundos / 60));
}

export default function Rutina() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [miRutina, setMiRutina] = useState<RutinaModelo | null>(null);
  const [disponibles, setDisponibles] = useState<RutinaModelo[]>([]);
  const [historial, setHistorial] = useState<SesionEntrenamiento[]>([]);
  const [asignando, setAsignando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [mia, todas, hist] = await Promise.all([
        rutinasApi.obtenerMiRutina(),
        rutinasApi.listarRutinas(),
        rutinasApi.obtenerHistorial(),
      ]);
      setMiRutina(mia);
      setDisponibles(todas);
      setHistorial(hist.slice(0, 5));
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

  async function elegirRutina(rutinaId: string) {
    setAsignando(rutinaId);
    try {
      await rutinasApi.asignarme(rutinaId);
      await cargar();
    } finally {
      setAsignando(null);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.contenedorCentro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const otrasRutinas = disponibles.filter((r) => r.id !== miRutina?.id);

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
      <Text style={[styles.titulo, { color: colors.text }]}>Rutina</Text>

      {miRutina ? (
        <View style={[styles.tarjetaHero, { backgroundColor: colors.tint }]}>
          <View style={styles.heroFilaSuperior}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroNivel, { color: colors.tintForeground }]}>
                {NIVEL_LABEL[miRutina.nivel] ?? miRutina.nivel}
              </Text>
              <Text style={[styles.heroTitulo, { color: colors.tintForeground }]}>{miRutina.nombre}</Text>
              <Text style={[styles.heroSubtitulo, { color: colors.tintForeground }]}>
                {miRutina.ejercicios.length} ejercicios · ~{duracionEstimadaMin(miRutina)} min
              </Text>
            </View>
            {miRutina.ejercicios[0]?.ejercicio.gifUrl && (
              <View style={[styles.heroFotoFondo, { borderColor: colors.tintForeground }]}>
                <Image source={{ uri: miRutina.ejercicios[0].ejercicio.gifUrl }} style={styles.heroFoto} contentFit="cover" />
              </View>
            )}
          </View>
          <Pressable
            style={[styles.botonIniciar, { backgroundColor: colors.tintForeground }]}
            onPress={() =>
              router.push({ pathname: '/entrenamiento/[rutinaId]', params: { rutinaId: miRutina.id } })
            }>
            <Text style={[styles.botonIniciarTexto, { color: colors.tint }]}>INICIAR ENTRENAMIENTO</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.tint} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.tarjetaVacia, { backgroundColor: colors.backgroundElement }]}>
          <Ionicons name="barbell-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.tarjetaVaciaTexto, { color: colors.textSecondary }]}>
            Aún no tienes una rutina activa. Elige una para empezar a entrenar.
          </Text>
        </View>
      )}

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>
        {miRutina ? 'Otras rutinas' : 'Elige tu rutina'}
      </Text>
      <View style={{ gap: Spacing.two }}>
        {otrasRutinas.map((rutina) => (
          <View key={rutina.id} style={[styles.tarjetaRutina, { backgroundColor: colors.backgroundElement }]}>
            {rutina.ejercicios[0]?.ejercicio.gifUrl && (
              <Image
                source={{ uri: rutina.ejercicios[0].ejercicio.gifUrl }}
                style={[styles.miniaturaFoto, { backgroundColor: colors.backgroundSelected }]}
                contentFit="cover"
              />
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.tarjetaRutinaNivel, { color: colors.tint }]}>
                {NIVEL_LABEL[rutina.nivel] ?? rutina.nivel}
              </Text>
              <Text style={[styles.tarjetaRutinaNombre, { color: colors.text }]}>{rutina.nombre}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {rutina.ejercicios.length} ejercicios · ~{duracionEstimadaMin(rutina)} min
              </Text>
            </View>
            <Pressable
              disabled={asignando === rutina.id}
              onPress={() => elegirRutina(rutina.id)}
              style={[styles.botonElegir, { borderColor: colors.tint }]}>
              {asignando === rutina.id ? (
                <ActivityIndicator color={colors.tint} size="small" />
              ) : (
                <Text style={[styles.botonElegirTexto, { color: colors.tint }]}>Elegir</Text>
              )}
            </Pressable>
          </View>
        ))}
        {otrasRutinas.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>No hay más rutinas disponibles por ahora.</Text>
        )}
      </View>

      {historial.length > 0 && (
        <>
          <Text style={[styles.seccionTitulo, { color: colors.text }]}>Historial reciente</Text>
          <View style={{ gap: Spacing.one }}>
            {historial.map((sesion) => (
              <View key={sesion.id} style={[styles.filaHistorial, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{sesion.rutina.nombre}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(sesion.completadaEn).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{sesion.duracionMin} min</Text>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>
                  {Math.round(sesion.caloriasEstimadas)} kcal
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.creditos, { color: colors.textSecondary }]}>
        Fotos y catálogo de ejercicios cortesía de wger.de (CC BY-SA)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedorCentro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenedor: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  tarjetaHero: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroFilaSuperior: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  heroFotoFondo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
  },
  heroFoto: {
    width: '100%',
    height: '100%',
  },
  heroNivel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  heroTitulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitulo: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: Spacing.two,
  },
  botonIniciar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: Spacing.two,
  },
  botonIniciarTexto: {
    fontWeight: '800',
    fontSize: 15,
  },
  tarjetaVacia: {
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  tarjetaVaciaTexto: {
    textAlign: 'center',
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  tarjetaRutina: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  miniaturaFoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  creditos: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  tarjetaRutinaNivel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tarjetaRutinaNombre: {
    fontSize: 16,
    fontWeight: '700',
  },
  botonElegir: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  botonElegirTexto: {
    fontWeight: '700',
    fontSize: 13,
  },
  filaHistorial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
});
