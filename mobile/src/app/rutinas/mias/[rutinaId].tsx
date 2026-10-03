import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';

import { ErrorApi } from '@/api/client';
import * as rutinasApi from '@/api/rutinas';
import type { Ejercicio, Rutina, RutinaEjercicio } from '@/api/rutinas';
import { AgregarEjercicioModal } from '@/components/entrenamiento/agregar-ejercicio-modal';
import { EjercicioDetalleModal } from '@/components/entrenamiento/ejercicio-detalle-modal';
import { UsarEnDiaModal } from '@/components/rutinas/usar-en-dia-modal';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { OBJETIVO_LABEL } from '@/constants/objetivos';
import { NIVEL_LABEL } from '@/constants/niveles';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ContenedorTeclado } from '@/components/ui/contenedor-teclado';

const NOMBRE_AUTOMATICO = /^Nuevo entrenamiento/i;

export default function EditarRutinaPersonal() {
  const colors = useTheme();
  const { rutinaId } = useLocalSearchParams<{ rutinaId: string }>();

  const [cargando, setCargando] = useState(true);
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [detalleEjercicio, setDetalleEjercicio] = useState<Ejercicio | null>(null);
  const [agregarARutina, setAgregarARutina] = useState(false);
  const [dialogoNombre, setDialogoNombre] = useState(false);
  const [salirAlGuardar, setSalirAlGuardar] = useState(false);
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

  function abrirDialogoNombre(alGuardarSalir: boolean) {
    if (!rutina) return;
    // Mientras tenga el nombre automático, el campo arranca vacío para escribir uno propio.
    setNombreBorrador(NOMBRE_AUTOMATICO.test(rutina.nombre) ? '' : rutina.nombre);
    setSalirAlGuardar(alGuardarSalir);
    setDialogoNombre(true);
  }

  async function confirmarNombre() {
    const nuevo = nombreBorrador.trim();
    if (!rutina || !nuevo) return;
    setDialogoNombre(false);
    setError(null);
    try {
      if (nuevo !== rutina.nombre) {
        await rutinasApi.actualizarRutinaPersonal(rutina.id, { nombre: nuevo });
      }
      if (salirAlGuardar) router.back();
      else cargar();
    } catch (e) {
      manejarError(e);
    }
  }

  // Todo se guarda al momento; "Guardar" cierra la edición. Si la rutina sigue
  // con el nombre automático, primero pide uno.
  function guardar() {
    if (rutina && NOMBRE_AUTOMATICO.test(rutina.nombre)) {
      abrirDialogoNombre(true);
      return;
    }
    router.back();
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
    setError(null);
    try {
      await rutinasApi.agregarEjercicioARutina(rutina.id, {
        ejercicioId: ejercicio.id,
        series: 3,
        repeticiones: 12,
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

  async function alTerminarArrastre({ from, to }: ReorderableListReorderEvent) {
    if (!rutina) return;
    setError(null);
    const anterior = rutina.ejercicios;
    const nuevoOrden = reorderItems(anterior, from, to);
    setRutina({ ...rutina, ejercicios: nuevoOrden });
    try {
      await rutinasApi.reordenarEjerciciosDeRutina(
        rutina.id,
        nuevoOrden.map((e) => e.id),
      );
    } catch (e) {
      setRutina({ ...rutina, ejercicios: anterior });
      manejarError(e);
    }
  }

  async function cambiarSeries(item: RutinaEjercicio, delta: number) {
    if (!rutina) return;
    const actual = item.series ?? 1;
    const nuevo = Math.max(1, actual + delta);
    if (nuevo === actual) return;
    setError(null);
    setRutina({ ...rutina, ejercicios: rutina.ejercicios.map((e) => (e.id === item.id ? { ...e, series: nuevo } : e)) });
    try {
      await rutinasApi.actualizarEjercicioDeRutina(rutina.id, item.id, { series: nuevo });
    } catch (e) {
      manejarError(e);
    }
  }

  // Siempre en repeticiones — si el ejercicio venía en modo tiempo (por
  // ejemplo clonado de una plantilla del gym), la primera edición lo pasa a
  // repeticiones definitivamente, limpiando duracionSeg.
  async function cambiarRepeticiones(item: RutinaEjercicio, delta: number) {
    if (!rutina) return;
    const actual = item.repeticiones ?? 12;
    const nuevo = Math.max(1, actual + delta);
    setError(null);
    const datos = { repeticiones: nuevo, duracionSeg: null as number | null };
    setRutina({ ...rutina, ejercicios: rutina.ejercicios.map((e) => (e.id === item.id ? { ...e, ...datos } : e)) });
    try {
      await rutinasApi.actualizarEjercicioDeRutina(rutina.id, item.id, datos);
    } catch (e) {
      manejarError(e);
    }
  }

  function comenzar() {
    if (!rutina) return;
    router.push({ pathname: '/entrenamiento/[rutinaId]', params: { rutinaId: rutina.id } });
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
      <View style={styles.barraSuperior}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.tituloPantalla, { color: colors.text }]}>Editar</Text>
        <Pressable onPress={confirmarEliminar} hitSlop={10}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <ReorderableList
        data={rutina.ejercicios}
        keyExtractor={(item) => item.id}
        onReorder={alTerminarArrastre}
        contentContainerStyle={styles.contenedor}
        renderItem={({ item }) => (
          <FilaEjercicio
            item={item}
            colors={colors}
            onDetalle={setDetalleEjercicio}
            onQuitar={quitarEjercicio}
            onCambiarRepeticiones={cambiarRepeticiones}
            onCambiarSeries={cambiarSeries}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: Spacing.four }}>
            Aún no agregas ejercicios. Toca &quot;Añadir ejercicios&quot; para empezar.
          </Text>
        }
        ListHeaderComponent={
          <View style={styles.encabezadoLista}>
            <Pressable style={styles.filaNombre} onPress={() => abrirDialogoNombre(false)}>
              <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={2}>
                {rutina.nombre}
              </Text>
              <View style={[styles.lapiz, { backgroundColor: colors.backgroundElement }]}>
                <Ionicons name="pencil" size={16} color={colors.textSecondary} />
              </View>
            </Pressable>

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

            {error && <Text style={{ color: colors.danger, fontSize: 13, marginTop: Spacing.two }}>{error}</Text>}

            <View style={styles.filaEntre}>
              <Text style={[styles.seccionTitulo, { color: colors.text }]}>
                Ejercicios <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>({rutina.ejercicios.length})</Text>
              </Text>
              <Pressable onPress={() => setModalAgregar(true)} hitSlop={8}>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 16 }}>Añadir</Text>
              </Pressable>
            </View>
            {rutina.ejercicios.length > 1 && (
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: Spacing.one }}>
                Mantén presionadas las tres líneas para arrastrar y reordenar.
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          <Pressable onPress={() => setModalAgregar(true)} style={styles.filaAnadir}>
            <Ionicons name="add" size={22} color={colors.tint} />
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 17 }}>Añadir ejercicios</Text>
          </Pressable>
        }
      />

      <View style={[styles.pieFijo, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Pressable
          disabled={rutina.ejercicios.length === 0}
          onPress={() => setAgregarARutina(true)}
          style={[styles.botonAgregarARutina, { borderColor: colors.tint, opacity: rutina.ejercicios.length === 0 ? 0.5 : 1 }]}>
          <Ionicons name="calendar-outline" size={18} color={colors.tint} />
          <Text style={{ color: colors.tint, fontSize: 15, fontWeight: '800' }}>Agregar a rutina</Text>
        </Pressable>
        <View style={styles.filaBotones}>
          <Pressable
            disabled={rutina.ejercicios.length === 0}
            onPress={comenzar}
            style={[
              styles.botonSecundario,
              { borderColor: colors.tint, opacity: rutina.ejercicios.length === 0 ? 0.5 : 1 },
            ]}>
            <Text style={{ color: colors.tint, fontSize: 16, fontWeight: '800' }}>Comenzar</Text>
          </Pressable>
          <Pressable onPress={guardar} style={[styles.botonPrincipal, { backgroundColor: colors.tint }]}>
            <Text style={{ color: colors.tintForeground, fontWeight: '800', fontSize: 16 }}>Guardar</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={dialogoNombre} transparent animationType="fade" onRequestClose={() => setDialogoNombre(false)}>
        <ContenedorTeclado style={styles.fondoDialogo}>
          <View style={[styles.dialogo, { backgroundColor: colors.background }]}>
            <Text style={[styles.dialogoTitulo, { color: colors.text }]}>Añade un nombre a tu plan</Text>
            <View style={[styles.dialogoCampo, { backgroundColor: colors.backgroundElement }]}>
              <TextInput
                value={nombreBorrador}
                onChangeText={setNombreBorrador}
                onSubmitEditing={confirmarNombre}
                placeholder="Ej. Piernas 1"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                maxLength={60}
                style={[styles.dialogoInput, { color: colors.text }]}
              />
              <Ionicons name="pencil" size={18} color={colors.tint} />
            </View>
            <View style={styles.dialogoBotones}>
              <Pressable onPress={() => setDialogoNombre(false)} hitSlop={8}>
                <Text style={{ color: colors.textSecondary, fontSize: 17, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirmarNombre} disabled={!nombreBorrador.trim()} hitSlop={8}>
                <Text style={{ color: colors.tint, fontSize: 17, fontWeight: '800', opacity: nombreBorrador.trim() ? 1 : 0.4 }}>
                  Guardar
                </Text>
              </Pressable>
            </View>
          </View>
        </ContenedorTeclado>
      </Modal>

      {agregarARutina && <UsarEnDiaModal rutina={rutina} onCerrar={() => setAgregarARutina(false)} />}

      {modalAgregar && (
        <AgregarEjercicioModal visible onCerrar={() => setModalAgregar(false)} onAgregar={agregarEjercicio} />
      )}

      {detalleEjercicio && (
        <EjercicioDetalleModal ejercicio={detalleEjercicio} onCerrar={() => setDetalleEjercicio(null)} />
      )}
    </View>
  );
}

function FilaEjercicio({
  item,
  colors,
  onDetalle,
  onQuitar,
  onCambiarRepeticiones,
  onCambiarSeries,
}: {
  item: RutinaEjercicio;
  colors: ReturnType<typeof useTheme>;
  onDetalle: (ejercicio: Ejercicio) => void;
  onQuitar: (item: RutinaEjercicio) => void;
  onCambiarRepeticiones: (item: RutinaEjercicio, delta: number) => void;
  onCambiarSeries: (item: RutinaEjercicio, delta: number) => void;
}) {
  const drag = useReorderableDrag();
  const isActive = useIsActive();
  const gif = item.ejercicio.gifUrl;

  return (
    <View
      style={[
        styles.filaEjercicio,
        { backgroundColor: isActive ? colors.backgroundSelected : colors.background, borderColor: colors.border },
      ]}>
      <Pressable onLongPress={drag} disabled={isActive} hitSlop={10} style={styles.asa}>
        <Ionicons name="reorder-three-outline" size={26} color={colors.textSecondary} />
      </Pressable>

      <Pressable onPress={() => onDetalle(item.ejercicio)} hitSlop={4}>
        {gif ? (
          <Image source={{ uri: gif }} style={[styles.miniaturaEjercicio, { backgroundColor: colors.backgroundElement }]} contentFit="cover" />
        ) : (
          <View style={[styles.miniaturaEjercicio, styles.iconoEjercicio, { backgroundColor: colors.backgroundElement }]}>
            <MunecoEjercicio patron={item.ejercicio.patronMovimiento} color={colors.tint} size={36} />
          </View>
        )}
      </Pressable>

      <View style={{ flex: 1, gap: Spacing.two }}>
        <Pressable onPress={() => onDetalle(item.ejercicio)}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }} numberOfLines={2}>
            {item.ejercicio.nombre.toUpperCase()}
          </Text>
        </Pressable>
        <View style={styles.filaSteppers}>
          <Stepper
            etiqueta="Repeticiones"
            valor={item.repeticiones ?? 12}
            onCambiar={(delta) => onCambiarRepeticiones(item, delta)}
            colors={colors}
          />
          <Stepper
            etiqueta="Series"
            valor={item.series ?? 1}
            onCambiar={(delta) => onCambiarSeries(item, delta)}
            colors={colors}
          />
        </View>
      </View>

      <Pressable onPress={() => onQuitar(item)} hitSlop={10}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
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
  contenedor: { padding: Spacing.four, paddingBottom: 110 },
  encabezadoLista: { gap: Spacing.one },
  filaEncabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
  },
  tituloPantalla: { flex: 1, fontSize: 22, fontWeight: '800' },
  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  nombre: { fontSize: 28, fontWeight: '900', flexShrink: 1 },
  lapiz: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputNombre: { flex: 1, fontSize: 20, fontWeight: '800', borderBottomWidth: 1.5, paddingVertical: 4 },
  etiqueta: { fontSize: 12.5, fontWeight: '700', marginTop: Spacing.three, marginBottom: 4 },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.four },
  seccionTitulo: { fontSize: 17, fontWeight: '800' },
  filaAgregar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filaEjercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  asa: { paddingRight: 2 },
  miniaturaEjercicio: { width: 76, height: 76, borderRadius: 12 },
  iconoEjercicio: { alignItems: 'center', justifyContent: 'center' },
  filaAnadir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, paddingVertical: Spacing.four },
  filaSteppers: { flexDirection: 'row', gap: Spacing.three },
  stepper: { alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
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
  botonAgregarARutina: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 12,
    marginBottom: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundario: {
    flex: 1,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrincipal: { flex: 1, borderRadius: 26, paddingVertical: 16, alignItems: 'center' },
  fondoDialogo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.four },
  dialogo: { borderRadius: 28, padding: Spacing.four, gap: Spacing.three },
  dialogoTitulo: { fontSize: 22, fontWeight: '900' },
  dialogoCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  dialogoInput: { flex: 1, fontSize: 18, paddingVertical: 14 },
  dialogoBotones: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.five },
});
