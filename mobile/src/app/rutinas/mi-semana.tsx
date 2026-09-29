import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { Rutina, RutinaFijadaPorDia } from '@/api/rutinas';
import { useSesion } from '@/context/auth-context';
import { DIAS_NOMBRE_LARGO } from '@/constants/dias';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, Spacing } from '@/constants/theme';

export default function MiSemana() {
  const colors = useTheme();
  const { cliente } = useSesion();

  const [cargando, setCargando] = useState(true);
  const [fijadas, setFijadas] = useState<RutinaFijadaPorDia[]>([]);
  const [disponibles, setDisponibles] = useState<Rutina[]>([]);
  const [propias, setPropias] = useState<Rutina[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [fij, disp, prop] = await Promise.all([
      rutinasApi.listarDiasFijados(),
      rutinasApi.listarRutinas(),
      rutinasApi.misRutinasPersonales(),
    ]);
    setFijadas(fij);
    setDisponibles(disp);
    setPropias(prop);
    setCargando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const diasConfigurados = cliente?.diasEntrenamientoSemana?.length
    ? [...cliente.diasEntrenamientoSemana].sort((a, b) => a - b)
    : [0, 1, 2, 3, 4, 5, 6];

  const fijadaPorDia = new Map(fijadas.map((f) => [f.diaSemana, f.rutina]));

  async function elegir(rutinaId: string) {
    if (diaSeleccionado === null) return;
    setGuardando(rutinaId);
    try {
      await rutinasApi.fijarRutinaEnDia(diaSeleccionado, rutinaId);
      setDiaSeleccionado(null);
      await cargar();
    } finally {
      setGuardando(null);
    }
  }

  async function volverAAutomatico() {
    if (diaSeleccionado === null) return;
    setGuardando('__automatico__');
    try {
      await rutinasApi.quitarRutinaDeDia(diaSeleccionado);
      setDiaSeleccionado(null);
      await cargar();
    } finally {
      setGuardando(null);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const opciones = [...propias, ...disponibles.filter((r) => !propias.some((p) => p.id === r.id))];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <View style={styles.filaEncabezado}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.titulo, { color: colors.text }]}>Mi semana</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 13.5, marginBottom: Spacing.three }}>
          Si quieres, fija una rutina para un día específico — todos los días que dejes en automático, la app te
          sugiere una rutina rotando según tus objetivos.
        </Text>

        <View style={{ gap: Spacing.two }}>
          {diasConfigurados.map((diaSemana) => {
            const rutinaFijada = fijadaPorDia.get(diaSemana);
            return (
              <Pressable
                key={diaSemana}
                onPress={() => setDiaSeleccionado(diaSemana)}
                style={[styles.filaDia, CardShadow, { backgroundColor: colors.backgroundElement }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15.5 }}>
                    {DIAS_NOMBRE_LARGO[diaSemana]}
                  </Text>
                  <Text style={{ color: rutinaFijada ? colors.tint : colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                    {rutinaFijada ? rutinaFijada.nombre : 'Automático según tus objetivos'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={diaSeleccionado !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDiaSeleccionado(null)}>
        <View style={styles.fondoModal}>
          <View style={[styles.contenidoModal, { backgroundColor: colors.background }]}>
            <View style={styles.filaEncabezadoModal}>
              <Text style={[styles.tituloModal, { color: colors.text }]}>
                {diaSeleccionado !== null ? DIAS_NOMBRE_LARGO[diaSeleccionado] : ''}
              </Text>
              <Pressable onPress={() => setDiaSeleccionado(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <Pressable
              onPress={volverAAutomatico}
              disabled={!!guardando}
              style={[styles.filaOpcion, { backgroundColor: colors.backgroundSelected }]}>
              <Ionicons name="shuffle-outline" size={20} color={colors.tint} />
              <Text style={{ color: colors.tint, fontWeight: '700', flex: 1 }}>Automático según tus objetivos</Text>
              {guardando === '__automatico__' && <ActivityIndicator color={colors.tint} size="small" />}
            </Pressable>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: Spacing.one, paddingBottom: Spacing.three }}>
              {opciones.map((rutina) => (
                <Pressable
                  key={rutina.id}
                  disabled={!!guardando}
                  onPress={() => elegir(rutina.id)}
                  style={[styles.filaOpcion, { backgroundColor: colors.backgroundElement }]}>
                  <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {rutina.nombre}
                  </Text>
                  {guardando === rutina.id && <ActivityIndicator color={colors.tint} size="small" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: { padding: Spacing.four, paddingBottom: Spacing.six },
  filaEncabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  titulo: { fontSize: 22, fontWeight: '800' },
  filaDia: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
  },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  contenidoModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '75%',
    gap: Spacing.two,
  },
  filaEncabezadoModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloModal: { fontSize: 18, fontWeight: '800' },
  filaOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    padding: Spacing.two,
  },
});
