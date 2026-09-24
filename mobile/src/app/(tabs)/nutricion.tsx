import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import * as nutricionApi from '@/api/nutricion';
import type { Comida, MetaNutricional } from '@/api/nutricion';

const TIPOS: { valor: Comida['tipo']; etiqueta: string }[] = [
  { valor: 'desayuno', etiqueta: 'Desayuno' },
  { valor: 'almuerzo', etiqueta: 'Almuerzo' },
  { valor: 'cena', etiqueta: 'Cena' },
  { valor: 'snack', etiqueta: 'Snack' },
];

const AGUA_INCREMENTOS = [250, 500];

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Nutricion() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [meta, setMeta] = useState<MetaNutricional | null>(null);
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [aguaMl, setAguaMl] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [agregandoAgua, setAgregandoAgua] = useState(false);

  const [tipo, setTipo] = useState<Comida['tipo']>('desayuno');
  const [nombre, setNombre] = useState('');
  const [calorias, setCalorias] = useState('');
  const [proteina, setProteina] = useState('');
  const [carbos, setCarbos] = useState('');
  const [grasa, setGrasa] = useState('');

  const cargar = useCallback(async () => {
    const fecha = hoyIso();
    const [metaData, comidasData, aguaData] = await Promise.all([
      nutricionApi.obtenerMeta(),
      nutricionApi.listarComidas(fecha),
      nutricionApi.obtenerAgua(fecha),
    ]);
    setMeta(metaData);
    setComidas(comidasData);
    setAguaMl(aguaData.totalMl);
    setCargando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function agregarAgua(cantidad: number) {
    setAgregandoAgua(true);
    try {
      await nutricionApi.agregarAgua(cantidad);
      setAguaMl((actual) => actual + cantidad);
    } finally {
      setAgregandoAgua(false);
    }
  }

  function limpiarFormulario() {
    setTipo('desayuno');
    setNombre('');
    setCalorias('');
    setProteina('');
    setCarbos('');
    setGrasa('');
  }

  async function guardarComida() {
    if (!nombre.trim() || !calorias) return;
    setGuardando(true);
    try {
      await nutricionApi.agregarComida({
        tipo,
        nombre: nombre.trim(),
        calorias: Number(calorias),
        proteinaG: proteina ? Number(proteina) : undefined,
        carbosG: carbos ? Number(carbos) : undefined,
        grasaG: grasa ? Number(grasa) : undefined,
      });
      limpiarFormulario();
      setModalVisible(false);
      await cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    await nutricionApi.eliminarComida(id);
    setComidas((actual) => actual.filter((c) => c.id !== id));
  }

  if (cargando || !meta) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const caloriasConsumidas = comidas.reduce((suma, c) => suma + c.calorias, 0);
  const caloriasRestantes = Math.max(0, meta.caloriasObjetivo - caloriasConsumidas);
  const progresoCalorias = Math.min(1, caloriasConsumidas / meta.caloriasObjetivo);
  const progresoAgua = Math.min(1, aguaMl / meta.aguaObjetivoMl);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <Text style={[styles.titulo, { color: colors.text }]}>Nutrición</Text>

      <View style={[styles.tarjetaCalorias, { backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Calorías de hoy</Text>
          <Text style={[styles.caloriasValor, { color: colors.text }]}>
            {Math.round(caloriasConsumidas)} <Text style={{ fontSize: 14, fontWeight: '600' }}>kcal</Text>
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {Math.round(caloriasRestantes)} kcal restantes de {Math.round(meta.caloriasObjetivo)}
          </Text>
          <View style={[styles.barraFondo, { backgroundColor: colors.border, marginTop: Spacing.two }]}>
            <View
              style={[styles.barraRelleno, { backgroundColor: colors.tint, width: `${progresoCalorias * 100}%` }]}
            />
          </View>
        </View>
      </View>

      <View style={[styles.tarjetaAgua, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.filaEntreItems}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
            <Ionicons name="water" size={20} color={colors.tint} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>Agua</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {aguaMl} / {meta.aguaObjetivoMl} ml
          </Text>
        </View>
        <View style={[styles.barraFondo, { backgroundColor: colors.border }]}>
          <View style={[styles.barraRelleno, { backgroundColor: colors.tint, width: `${progresoAgua * 100}%` }]} />
        </View>
        <View style={styles.filaBotonesAgua}>
          {AGUA_INCREMENTOS.map((cantidad) => (
            <Pressable
              key={cantidad}
              disabled={agregandoAgua}
              onPress={() => agregarAgua(cantidad)}
              style={[styles.botonAgua, { borderColor: colors.tint }]}>
              <Text style={{ color: colors.tint, fontWeight: '700' }}>+{cantidad}ml</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filaEntreItems}>
        <Text style={[styles.seccionTitulo, { color: colors.text }]}>Comidas de hoy</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.botonAgregar, { backgroundColor: colors.tint }]}>
          <Ionicons name="add" size={18} color={colors.tintForeground} />
        </Pressable>
      </View>

      <View style={{ gap: Spacing.two }}>
        {TIPOS.map(({ valor, etiqueta }) => {
          const items = comidas.filter((c) => c.tipo === valor);
          if (items.length === 0) return null;
          return (
            <View key={valor}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 4 }}>
                {etiqueta.toUpperCase()}
              </Text>
              {items.map((comida) => (
                <View key={comida.id} style={[styles.filaComida, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{comida.nombre}</Text>
                    {(comida.proteinaG || comida.carbosG || comida.grasaG) && (
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        P {comida.proteinaG ?? 0}g · C {comida.carbosG ?? 0}g · G {comida.grasaG ?? 0}g
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{Math.round(comida.calorias)} kcal</Text>
                  <Pressable onPress={() => eliminar(comida.id)} style={{ marginLeft: Spacing.two }}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })}
        {comidas.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>Aún no registras comidas hoy. Toca “+” para agregar una.</Text>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colors.background }]}>
            <View style={styles.filaEntreItems}>
              <Text style={[styles.seccionTitulo, { color: colors.text }]}>Agregar comida</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.filaTipos}>
              {TIPOS.map(({ valor, etiqueta }) => (
                <Pressable
                  key={valor}
                  onPress={() => setTipo(valor)}
                  style={[
                    styles.chipTipo,
                    {
                      backgroundColor: tipo === valor ? colors.tint : colors.backgroundElement,
                      borderColor: colors.tint,
                    },
                  ]}>
                  <Text style={{ color: tipo === valor ? colors.tintForeground : colors.text, fontSize: 13 }}>
                    {etiqueta}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Pechuga con arroz"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              value={calorias}
              onChangeText={setCalorias}
              placeholder="Calorías (kcal)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <View style={styles.filaMacros}>
              <TextInput
                value={proteina}
                onChangeText={setProteina}
                placeholder="Proteína (g)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, styles.inputTercio, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                value={carbos}
                onChangeText={setCarbos}
                placeholder="Carbos (g)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, styles.inputTercio, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                value={grasa}
                onChangeText={setGrasa}
                placeholder="Grasa (g)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, styles.inputTercio, { borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <Pressable
              onPress={guardarComida}
              disabled={guardando || !nombre.trim() || !calorias}
              style={[styles.botonGuardar, { backgroundColor: colors.tint, opacity: guardando ? 0.7 : 1 }]}>
              {guardando ? (
                <ActivityIndicator color={colors.tintForeground} />
              ) : (
                <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  titulo: { fontSize: 26, fontWeight: '800', marginTop: Spacing.two },
  tarjetaCalorias: { borderRadius: 20, padding: Spacing.four },
  caloriasValor: { fontSize: 32, fontWeight: '800' },
  barraFondo: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.one },
  barraRelleno: { height: 8, borderRadius: 4 },
  tarjetaAgua: { borderRadius: 20, padding: Spacing.four, gap: Spacing.two },
  filaEntreItems: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaBotonesAgua: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  botonAgua: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  seccionTitulo: { fontSize: 18, fontWeight: '800' },
  botonAgregar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  filaComida: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContenido: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  filaTipos: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  chipTipo: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 15,
  },
  filaMacros: { flexDirection: 'row', gap: Spacing.two },
  inputTercio: { flex: 1 },
  botonGuardar: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
