import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import * as rutinasApi from '@/api/rutinas';
import type { Ejercicio, Rutina, RutinaEjercicio } from '@/api/rutinas';
import { AgregarEjercicioModal } from '@/components/entrenamiento/agregar-ejercicio-modal';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { OBJETIVO_LABEL } from '@/constants/objetivos';
import { NIVEL_LABEL } from '@/constants/niveles';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CampoNumerico = 'series' | 'repeticiones' | 'duracionSeg' | 'descansoSeg';

export default function EditarRutinaPersonal() {
  const colors = useTheme();
  const { rutinaId } = useLocalSearchParams<{ rutinaId: string }>();

  const [cargando, setCargando] = useState(true);
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [comenzando, setComenzando] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const rutinas = await rutinasApi.misRutinasPersonales();
    setRutina(rutinas.find((r) => r.id === rutinaId) ?? null);
    setCargando(false);
  }, [rutinaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function manejarError(e: unknown) {
    setError(e instanceof ErrorApi ? e.message : 'No pudimos guardar el cambio. Intenta de nuevo.');
    cargar();
  }

  async function guardarNombre() {
    setEditandoNombre(false);
    if (!rutina || !nombreBorrador.trim() || nombreBorrador === rutina.nombre) return;
    setError(null);
    try {
      await rutinasApi.actualizarRutinaPersonal(rutina.id, { nombre: nombreBorrador.trim() });
      cargar();
    } catch (e) {
      manejarError(e);
    }
  }

  async function cambiarNivel(nivel: string) {
    if (!rutina) return;
    setError(null);
    setRutina({ ...rutina, nivel: nivel as Rutina['nivel'] });
    try {
      await rutinasApi.actualizarRutinaPersonal(rutina.id, { nivel });
    } catch (e) {
      manejarError(e);
    }
  }

  async function cambiarObjetivo(objetivo: string) {
    if (!rutina) return;
    setError(null);
    setRutina({ ...rutina, objetivo });
    try {
      await rutinasApi.actualizarRutinaPersonal(rutina.id, { objetivo });
    } catch (e) {
      manejarError(e);
    }
  }

  function confirmarEliminar() {
    Alert.alert('¿Eliminar esta rutina?', 'Se borrará junto con todos sus ejercicios.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!rutina) return;
          try {
            await rutinasApi.eliminarRutinaPersonal(rutina.id);
            router.back();
          } catch (e) {
            manejarError(e);
          }
        },
      },
    ]);
  }

  async function agregarEjercicio(ejercicio: Ejercicio) {
    if (!rutina) return;
    setModalAgregar(false);
    setError(null);
    try {
      await rutinasApi.agregarEjercicioARutina(rutina.id, {
        ejercicioId: ejercicio.id,
        series: 3,
        ...(ejercicio.tipoMedida === 'duracion' ? { duracionSeg: 30 } : { repeticiones: 12 }),
        descansoSeg: 20,
      });
      cargar();
    } catch (e) {
      manejarError(e);
    }
  }

  async function quitarEjercicio(item: RutinaEjercicio) {
    if (!rutina) return;
    setError(null);
    setRutina({ ...rutina, ejercicios: rutina.ejercicios.filter((e) => e.id !== item.id) });
    try {
      await rutinasApi.eliminarEjercicioDeRutina(rutina.id, item.id);
    } catch (e) {
      manejarError(e);
    }
  }

  async function mover(item: RutinaEjercicio, direccion: 'arriba' | 'abajo') {
    if (!rutina) return;
    setError(null);
    try {
      await rutinasApi.moverEjercicioDeRutina(rutina.id, item.id, direccion);
      cargar();
    } catch (e) {
      manejarError(e);
    }
  }

  async function cambiarValor(item: RutinaEjercicio, campo: CampoNumerico, delta: number, minimo: number) {
    if (!rutina) return;
    const actual = item[campo] ?? minimo;
    const nuevo = Math.max(minimo, actual + delta);
    if (nuevo === actual) return;
    setError(null);
    setRutina({
      ...rutina,
      ejercicios: rutina.ejercicios.map((e) => (e.id === item.id ? { ...e, [campo]: nuevo } : e)),
    });
    try {
      await rutinasApi.actualizarEjercicioDeRutina(rutina.id, item.id, { [campo]: nuevo });
    } catch (e) {
      manejarError(e);
    }
  }

  async function comenzar() {
    if (!rutina) return;
    setComenzando(true);
    try {
      await rutinasApi.asignarme(rutina.id);
      router.push({ pathname: '/entrenamiento/[rutinaId]', params: { rutinaId: rutina.id } });
    } finally {
      setComenzando(false);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (!rutina) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>No encontramos esta rutina.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <View style={styles.filaEncabezado}>
          {editandoNombre ? (
            <TextInput
              value={nombreBorrador}
              onChangeText={setNombreBorrador}
              onBlur={guardarNombre}
              onSubmitEditing={guardarNombre}
              autoFocus
              style={[styles.inputNombre, { color: colors.text, borderColor: colors.border }]}
            />
          ) : (
            <Pressable
              style={styles.filaNombre}
              onPress={() => {
                setNombreBorrador(rutina.nombre);
                setEditandoNombre(true);
              }}>
              <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
                {rutina.nombre}
              </Text>
              <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          <Pressable onPress={confirmarEliminar} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>

        <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Nivel</Text>
        <View style={styles.filaChips}>
          {Object.keys(NIVEL_LABEL).map((valor) => (
            <Pressable
              key={valor}
              onPress={() => cambiarNivel(valor)}
              style={[
                styles.chip,
                { backgroundColor: rutina.nivel === valor ? colors.tint : colors.backgroundElement, borderColor: colors.border },
              ]}>
              <Text
                style={{
                  color: rutina.nivel === valor ? colors.tintForeground : colors.text,
                  fontWeight: '700',
                  fontSize: 12.5,
                }}>
                {NIVEL_LABEL[valor]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Objetivo</Text>
        <View style={styles.filaChips}>
          {Object.keys(OBJETIVO_LABEL).map((valor) => (
            <Pressable
              key={valor}
              onPress={() => cambiarObjetivo(valor)}
              style={[
                styles.chip,
                { backgroundColor: rutina.objetivo === valor ? colors.tint : colors.backgroundElement, borderColor: colors.border },
              ]}>
              <Text
                style={{
                  color: rutina.objetivo === valor ? colors.tintForeground : colors.text,
                  fontWeight: '700',
                  fontSize: 12.5,
                }}>
                {OBJETIVO_LABEL[valor]}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}

        <View style={styles.filaEntre}>
          <Text style={[styles.seccionTitulo, { color: colors.text }]}>Ejercicios ({rutina.ejercicios.length})</Text>
          <Pressable onPress={() => setModalAgregar(true)} style={styles.filaAgregar}>
            <Ionicons name="add-circle" size={20} color={colors.tint} />
            <Text style={{ color: colors.tint, fontWeight: '700' }}>Agregar</Text>
          </Pressable>
        </View>

        <View style={{ gap: Spacing.two }}>
          {rutina.ejercicios.map((item, indice) => (
            <View key={item.id} style={[styles.filaEjercicio, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.filaEjercicioSuperior}>
                <MunecoEjercicio patron={item.ejercicio.patronMovimiento} color={colors.tint} size={26} />
                <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                  {item.ejercicio.nombre}
                </Text>
                <Pressable onPress={() => mover(item, 'arriba')} disabled={indice === 0} hitSlop={6}>
                  <Ionicons name="chevron-up" size={20} color={indice === 0 ? colors.border : colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => mover(item, 'abajo')} disabled={indice === rutina.ejercicios.length - 1} hitSlop={6}>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={indice === rutina.ejercicios.length - 1 ? colors.border : colors.textSecondary}
                  />
                </Pressable>
                <Pressable onPress={() => quitarEjercicio(item)} hitSlop={6}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.filaSteppers}>
                <Stepper
                  etiqueta="Series"
                  valor={item.series ?? 1}
                  onCambiar={(delta) => cambiarValor(item, 'series', delta, 1)}
                  colors={colors}
                />
                {item.ejercicio.tipoMedida === 'duracion' ? (
                  <Stepper
                    etiqueta="Segundos"
                    valor={item.duracionSeg ?? 30}
                    paso={5}
                    onCambiar={(delta) => cambiarValor(item, 'duracionSeg', delta, 5)}
                    colors={colors}
                  />
                ) : (
                  <Stepper
                    etiqueta="Reps"
                    valor={item.repeticiones ?? 12}
                    onCambiar={(delta) => cambiarValor(item, 'repeticiones', delta, 1)}
                    colors={colors}
                  />
                )}
                <Stepper
                  etiqueta="Descanso"
                  valor={item.descansoSeg ?? 20}
                  paso={5}
                  onCambiar={(delta) => cambiarValor(item, 'descansoSeg', delta, 0)}
                  colors={colors}
                />
              </View>
            </View>
          ))}
          {rutina.ejercicios.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.three }}>
              Aún no agregas ejercicios. Toca &quot;Agregar&quot; para empezar.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.pieFijo, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Pressable
          disabled={rutina.ejercicios.length === 0 || comenzando}
          onPress={comenzar}
          style={[
            styles.botonPrincipal,
            { backgroundColor: colors.tint, opacity: rutina.ejercicios.length === 0 || comenzando ? 0.5 : 1 },
          ]}>
          {comenzando ? (
            <ActivityIndicator color={colors.tintForeground} />
          ) : (
            <Text style={{ color: colors.tintForeground, fontWeight: '800', fontSize: 16 }}>Comenzar entrenamiento</Text>
          )}
        </Pressable>
      </View>

      {modalAgregar && (
        <AgregarEjercicioModal visible onCerrar={() => setModalAgregar(false)} onAgregar={agregarEjercicio} />
      )}
    </View>
  );
}

function Stepper({
  etiqueta,
  valor,
  paso = 1,
  onCambiar,
  colors,
}: {
  etiqueta: string;
  valor: number;
  paso?: number;
  onCambiar: (delta: number) => void;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' }}>
        {etiqueta}
      </Text>
      <View style={[styles.stepperFila, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Pressable onPress={() => onCambiar(-paso)} hitSlop={6} style={styles.stepperBoton}>
          <Ionicons name="remove" size={16} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, minWidth: 24, textAlign: 'center' }}>
          {valor}
        </Text>
        <Pressable onPress={() => onCambiar(paso)} hitSlop={6} style={styles.stepperBoton}>
          <Ionicons name="add" size={16} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  contenedor: { padding: Spacing.four, paddingBottom: 110, gap: Spacing.one },
  filaEncabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  filaNombre: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  nombre: { fontSize: 22, fontWeight: '800', flexShrink: 1 },
  inputNombre: { flex: 1, fontSize: 20, fontWeight: '800', borderBottomWidth: 1.5, paddingVertical: 4 },
  etiqueta: { fontSize: 12.5, fontWeight: '700', marginTop: Spacing.three, marginBottom: 4 },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.four },
  seccionTitulo: { fontSize: 17, fontWeight: '800' },
  filaAgregar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filaEjercicio: { borderRadius: 16, padding: Spacing.two, gap: Spacing.two },
  filaEjercicioSuperior: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  filaSteppers: { flexDirection: 'row', gap: Spacing.two },
  stepper: { alignItems: 'center', gap: 4 },
  stepperFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBoton: { padding: 2 },
  pieFijo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.four, borderTopWidth: 1 },
  botonPrincipal: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
});
