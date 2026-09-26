import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { ErrorApi } from '@/api/client';
import * as recordatoriosApi from '@/api/recordatorios';
import type { Recordatorio } from '@/api/recordatorios';
import {
  notificacionesDisponibles,
  pedirPermisoNotificaciones,
  sincronizarNotificaciones,
} from '@/lib/notificaciones';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { DIAS_CORTOS, DIAS_NOMBRE } from '@/constants/dias';

function etiquetaDias(dias: number[]) {
  if (dias.length === 7) return 'Todos los días';
  return [...dias].sort().map((d) => DIAS_NOMBRE[d]).join(', ');
}

export default function Recordatorios() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [hora, setHora] = useState(new Date());
  const [mostrarHora, setMostrarHora] = useState(Platform.OS === 'ios');
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const datos = await recordatoriosApi.listarRecordatorios();
      setRecordatorios(datos);
      await sincronizarNotificaciones(datos);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos cargar tus recordatorios');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function abrirModalNuevo() {
    setHora(new Date());
    setDiasSeleccionados([0, 1, 2, 3, 4, 5, 6]);
    setModalVisible(true);
  }

  function alternarDia(dia: number) {
    setDiasSeleccionados((actual) =>
      actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia].sort(),
    );
  }

  async function guardarNuevo() {
    if (diasSeleccionados.length === 0) return;
    setGuardando(true);
    try {
      const permiso = await pedirPermisoNotificaciones();
      if (permiso === 'denegado') {
        setError('Necesitamos permiso de notificaciones para poder recordarte');
        return;
      }
      const horaTexto = `${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`;
      await recordatoriosApi.crearRecordatorio({ hora: horaTexto, diasSemana: diasSeleccionados });
      setModalVisible(false);
      await cargar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos crear el recordatorio');
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(recordatorio: Recordatorio) {
    try {
      await recordatoriosApi.actualizarRecordatorio(recordatorio.id, { activo: !recordatorio.activo });
      await cargar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos actualizar el recordatorio');
    }
  }

  async function eliminar(id: string) {
    try {
      await recordatoriosApi.eliminarRecordatorio(id);
      await cargar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos eliminar el recordatorio');
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.contenedor}>
        {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}

        {!notificacionesDisponibles && (
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
            Las alarmas locales no funcionan en Expo Go en Android. Se guardarán igual, pero solo sonarán en una
            versión instalada (development build) de la app.
          </Text>
        )}

        {recordatorios.map((recordatorio) => (
          <View key={recordatorio.id} style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hora, { color: colors.text }]}>{recordatorio.hora}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                {etiquetaDias(recordatorio.diasSemana)}
              </Text>
            </View>
            <Switch
              value={recordatorio.activo}
              onValueChange={() => alternarActivo(recordatorio)}
              trackColor={{ true: colors.tint }}
            />
            <Pressable onPress={() => eliminar(recordatorio.id)} style={{ marginLeft: Spacing.two }}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ))}

        {recordatorios.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>
            No tienes recordatorios. Toca &quot;+&quot; para crear el primero.
          </Text>
        )}
      </ScrollView>

      <Pressable onPress={abrirModalNuevo} style={[styles.fab, { backgroundColor: colors.tint }]}>
        <Ionicons name="add" size={26} color={colors.tintForeground} />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colors.background }]}>
            <View style={styles.filaEntreItems}>
              <Text style={[styles.tituloModal, { color: colors.text }]}>Nuevo recordatorio</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {Platform.OS === 'android' && (
              <Pressable
                onPress={() => setMostrarHora(true)}
                style={[styles.input, { borderColor: colors.border, alignItems: 'center' }]}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                  {`${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`}
                </Text>
              </Pressable>
            )}
            {mostrarHora && (
              <DateTimePicker
                value={hora}
                mode="time"
                display="spinner"
                onChange={(_evento, seleccionada) => {
                  setMostrarHora(Platform.OS === 'ios');
                  if (seleccionada) setHora(seleccionada);
                }}
                style={{ alignSelf: 'center' }}
              />
            )}

            <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Repetir</Text>
            <View style={styles.filaDias}>
              {DIAS_CORTOS.map((letra, indice) => (
                <Pressable
                  key={indice}
                  onPress={() => alternarDia(indice)}
                  style={[
                    styles.diaCirculo,
                    {
                      backgroundColor: diasSeleccionados.includes(indice) ? colors.tint : colors.backgroundElement,
                    },
                  ]}>
                  <Text
                    style={{
                      color: diasSeleccionados.includes(indice) ? colors.tintForeground : colors.textSecondary,
                      fontWeight: '700',
                    }}>
                    {letra}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={guardarNuevo}
              disabled={guardando || diasSeleccionados.length === 0}
              style={[
                styles.boton,
                { backgroundColor: colors.tint, opacity: guardando || diasSeleccionados.length === 0 ? 0.6 : 1 },
              ]}>
              {guardando ? (
                <ActivityIndicator color={colors.tintForeground} />
              ) : (
                <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
  },
  hora: { fontSize: 20, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.five,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContenido: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.two },
  filaEntreItems: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloModal: { fontSize: 18, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  etiqueta: { fontSize: 13, fontWeight: '600', marginTop: Spacing.one },
  filaDias: { flexDirection: 'row', justifyContent: 'space-between' },
  diaCirculo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
