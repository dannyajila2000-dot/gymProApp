import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import * as rutinasApi from '@/api/rutinas';
import type { Rutina } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { SustituirEjercicioModal } from '@/components/entrenamiento/sustituir-ejercicio-modal';
import { UsarEnDiaModal } from '@/components/rutinas/usar-en-dia-modal';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, Spacing } from '@/constants/theme';
import { OBJETIVO_LABEL } from '@/constants/objetivos';
import { NIVEL_LABEL } from '@/constants/niveles';
import { caloriasEstimadas, duracionEstimadaMin } from '@/lib/rutina-utils';

export default function DetalleRutina() {
  const colors = useTheme();
  const { cliente } = useSesion();
  const { rutinaId } = useLocalSearchParams<{ rutinaId: string }>();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
  const [usarEnDia, setUsarEnDia] = useState(false);
  const [sustituirItem, setSustituirItem] = useState<{ id: string; nombre: string } | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      // Misma versión que verá al entrenar (ajustada a su nivel, restricciones
      // y sustituciones), para que duración y calorías coincidan.
      setRutina(await rutinasApi.obtenerRutinaParaEntrenar(rutinaId));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos cargar esta rutina');
    } finally {
      setCargando(false);
    }
  }, [rutinaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function comenzar() {
    if (!rutina) return;
    router.push({ pathname: '/entrenamiento/[rutinaId]', params: { rutinaId: rutina.id } });
  }

  async function editarRutina() {
    if (!rutina) return;
    if (rutina.creadaPorClienteId === cliente?.id) {
      router.push({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: rutina.id } });
      return;
    }
    setDuplicando(true);
    try {
      const nueva = await rutinasApi.duplicarComoPersonal(rutina.id);
      router.replace({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: nueva.id } });
    } finally {
      setDuplicando(false);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (error || !rutina) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background, gap: Spacing.two }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {error ?? 'No encontramos esta rutina.'}
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const primeraFoto = rutina.imagenUrl ?? rutina.ejercicios[0]?.ejercicio.gifUrl ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.backgroundElement }]}>
          {primeraFoto ? (
            <Image source={{ uri: primeraFoto }} style={styles.heroFoto} contentFit="cover" />
          ) : (
            <View style={styles.heroFoto}>
              <Ionicons name="barbell-outline" size={48} color={colors.textSecondary} />
            </View>
          )}
          <Pressable onPress={() => router.back()} style={[styles.botonAtras, CardShadow, { backgroundColor: colors.background }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.contenido}>
          <Text style={[styles.nivel, { color: colors.tint }]}>{NIVEL_LABEL[rutina.nivel] ?? rutina.nivel}</Text>
          <Text style={[styles.nombre, { color: colors.text }]}>{rutina.nombre}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {OBJETIVO_LABEL[rutina.objetivo] ?? rutina.objetivo}
          </Text>

          <View style={styles.filaInfo}>
            <View style={[styles.tarjetaInfo, CardShadow, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="flame-outline" size={20} color={colors.tint} />
              <Text style={[styles.tarjetaInfoValor, { color: colors.text }]}>{caloriasEstimadas(rutina)}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>kcal aprox.</Text>
            </View>
            <View style={[styles.tarjetaInfo, CardShadow, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="time-outline" size={20} color={colors.tint} />
              <Text style={[styles.tarjetaInfoValor, { color: colors.text }]}>{duracionEstimadaMin(rutina)}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>minutos</Text>
            </View>
            <View style={[styles.tarjetaInfo, CardShadow, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="layers-outline" size={20} color={colors.tint} />
              <Text style={[styles.tarjetaInfoValor, { color: colors.text }]}>{rutina.ejercicios.length}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>ejercicios</Text>
            </View>
          </View>

          {rutina.descripcion && (
            <Pressable onPress={() => setDescripcionExpandida((v) => !v)}>
              <Text
                style={[styles.descripcion, { color: colors.textSecondary }]}
                numberOfLines={descripcionExpandida ? undefined : 3}>
                {rutina.descripcion}
              </Text>
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12.5, marginTop: 4 }}>
                {descripcionExpandida ? 'Ver menos' : 'Ver más'}
              </Text>
            </Pressable>
          )}

          <View style={styles.filaEntreSeccion}>
            <Text style={[styles.seccionTitulo, { color: colors.text }]}>Ejercicios ({rutina.ejercicios.length})</Text>
            <Pressable onPress={editarRutina} disabled={duplicando} style={styles.filaEditar}>
              {duplicando ? (
                <ActivityIndicator color={colors.tint} size="small" />
              ) : (
                <>
                  <Ionicons name="create-outline" size={18} color={colors.tint} />
                  <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13.5 }}>Editar esta rutina</Text>
                </>
              )}
            </Pressable>
          </View>
          <View style={{ gap: Spacing.two }}>
            {rutina.ejercicios.map((item) => (
              <View key={item.id} style={[styles.filaEjercicio, CardShadow, { backgroundColor: colors.backgroundElement }]}>
                <View style={[styles.iconoEjercicio, { backgroundColor: colors.background }]}>
                  <MunecoEjercicio patron={item.ejercicio.patronMovimiento} color={colors.tint} size={36} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15.5 }}>{item.ejercicio.nombre}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                    {item.duracionSeg ? `${item.duracionSeg}s` : `x${item.repeticiones ?? 10}`}
                    {' · '}
                    {item.series ?? 1} serie{(item.series ?? 1) > 1 ? 's' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSustituirItem({ id: item.id, nombre: item.ejercicio.nombre })}
                  hitSlop={8}>
                  <Ionicons name="swap-horizontal-outline" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.pieFijo, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.filaBotones}>
          <Pressable
            style={[styles.botonSecundario, { borderColor: colors.tint }]}
            onPress={() => setUsarEnDia(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.tint} />
            <Text style={{ color: colors.tint, fontSize: 15, fontWeight: '800' }}>Agregar a rutina</Text>
          </Pressable>
          <Pressable style={[styles.botonPrincipal, { backgroundColor: colors.tint }]} onPress={comenzar}>
            <Text style={[styles.botonPrincipalTexto, { color: colors.tintForeground }]}>Comenzar</Text>
          </Pressable>
        </View>
      </View>

      {usarEnDia && <UsarEnDiaModal rutina={rutina} onCerrar={() => setUsarEnDia(false)} />}

      {sustituirItem && (
        <SustituirEjercicioModal
          visible
          onCerrar={() => setSustituirItem(null)}
          rutinaEjercicioId={sustituirItem.id}
          nombreActual={sustituirItem.nombre}
          onSustituido={cargar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  scroll: { paddingBottom: 110 },
  hero: { width: '100%', height: 220 },
  heroFoto: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  botonAtras: {
    position: 'absolute',
    top: Spacing.four,
    left: Spacing.three,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: { padding: Spacing.four, gap: Spacing.one },
  nivel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  nombre: { fontSize: 24, fontWeight: '800' },
  filaInfo: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  tarjetaInfo: { flex: 1, borderRadius: 16, padding: Spacing.two, alignItems: 'center', gap: 2 },
  tarjetaInfoValor: { fontSize: 16, fontWeight: '800' },
  descripcion: { fontSize: 14, lineHeight: 20, marginTop: Spacing.three },
  seccionTitulo: { fontSize: 17, fontWeight: '800' },
  filaEntreSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
  },
  filaEditar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filaEjercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
  },
  iconoEjercicio: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pieFijo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  filaBotones: { flexDirection: 'row', gap: Spacing.two },
  botonSecundario: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrincipal: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  botonPrincipalTexto: { fontSize: 16, fontWeight: '800' },
});
