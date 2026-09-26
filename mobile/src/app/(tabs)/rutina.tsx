import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import * as rutinasApi from '@/api/rutinas';
import type { Rutina as RutinaModelo, SesionEntrenamiento } from '@/api/rutinas';
import { OBJETIVO_LABEL } from '@/constants/objetivos';
import { duracionEstimadaMin } from '@/lib/rutina-utils';

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function Rutina() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [miRutina, setMiRutina] = useState<RutinaModelo | null>(null);
  const [disponibles, setDisponibles] = useState<RutinaModelo[]>([]);
  const [propias, setPropias] = useState<RutinaModelo[]>([]);
  const [historial, setHistorial] = useState<SesionEntrenamiento[]>([]);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [filtroObjetivo, setFiltroObjetivo] = useState<string | null>(null);
  const [filtroNivel, setFiltroNivel] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [mia, todas, mias, hist] = await Promise.all([
        rutinasApi.obtenerMiRutina(),
        rutinasApi.listarRutinas(),
        rutinasApi.misRutinasPersonales(),
        rutinasApi.obtenerHistorial(),
      ]);
      setMiRutina(mia);
      setDisponibles(todas);
      setPropias(mias);
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
  const objetivosDisponibles = [...new Set(otrasRutinas.map((r) => r.objetivo))];
  const nivelesDisponibles = [...new Set(otrasRutinas.map((r) => r.nivel))];
  const rutinasFiltradas = otrasRutinas.filter(
    (r) => (!filtroObjetivo || r.objetivo === filtroObjetivo) && (!filtroNivel || r.nivel === filtroNivel),
  );

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

      {otrasRutinas.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
            <ChipFiltro
              activo={filtroObjetivo === null}
              texto="Todos"
              onPress={() => setFiltroObjetivo(null)}
              colors={colors}
            />
            {objetivosDisponibles.map((objetivo) => (
              <ChipFiltro
                key={objetivo}
                activo={filtroObjetivo === objetivo}
                texto={OBJETIVO_LABEL[objetivo] ?? objetivo}
                onPress={() => setFiltroObjetivo((actual) => (actual === objetivo ? null : objetivo))}
                colors={colors}
              />
            ))}
          </ScrollView>
          {nivelesDisponibles.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
              <ChipFiltro
                activo={filtroNivel === null}
                texto="Todos los niveles"
                onPress={() => setFiltroNivel(null)}
                colors={colors}
              />
              {nivelesDisponibles.map((nivel) => (
                <ChipFiltro
                  key={nivel}
                  activo={filtroNivel === nivel}
                  texto={NIVEL_LABEL[nivel] ?? nivel}
                  onPress={() => setFiltroNivel((actual) => (actual === nivel ? null : nivel))}
                  colors={colors}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}

      <View style={{ gap: Spacing.two }}>
        {rutinasFiltradas.map((rutina) => (
          <Pressable
            key={rutina.id}
            onPress={() => router.push({ pathname: '/rutinas/[rutinaId]', params: { rutinaId: rutina.id } })}
            style={[styles.tarjetaRutina, { backgroundColor: colors.backgroundElement }]}>
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
          </Pressable>
        ))}
        {otrasRutinas.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>No hay más rutinas disponibles por ahora.</Text>
        )}
        {otrasRutinas.length > 0 && rutinasFiltradas.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>Ninguna rutina combina con este filtro.</Text>
        )}
      </View>

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>Diseña tu propio entrenamiento</Text>
      <Pressable
        onPress={() => router.push('/rutinas/nueva')}
        style={[styles.tarjetaCrear, { backgroundColor: colors.backgroundElement, borderColor: colors.tint }]}>
        <Ionicons name="add-circle-outline" size={22} color={colors.tint} />
        <Text style={{ color: colors.tint, fontWeight: '700' }}>Crear una rutina nueva</Text>
      </Pressable>
      {propias.length > 0 && (
        <View style={{ gap: Spacing.two }}>
          {propias.map((rutina) => (
            <Pressable
              key={rutina.id}
              onPress={() => router.push({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: rutina.id } })}
              style={[styles.tarjetaRutina, { backgroundColor: colors.backgroundElement }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.tarjetaRutinaNombre, { color: colors.text }]}>{rutina.nombre}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{rutina.ejercicios.length} ejercicios</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      )}

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

function ChipFiltro({
  activo,
  texto,
  onPress,
  colors,
}: {
  activo: boolean;
  texto: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: activo ? colors.tint : colors.backgroundElement, borderColor: colors.border },
      ]}>
      <Text style={{ color: activo ? colors.tintForeground : colors.textSecondary, fontSize: 13, fontWeight: '700' }}>
        {texto}
      </Text>
    </Pressable>
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
  filaChips: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingBottom: 4,
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  tarjetaRutina: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  tarjetaCrear: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: Spacing.three,
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
