import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useSesion } from '@/context/auth-context';
import * as progresoApi from '@/api/progreso';
import type { RegistroProgreso } from '@/api/progreso';
import * as clientesApi from '@/api/clientes';
import { calcularImc, categoriaImc } from '@/lib/imc';

const OBJETIVO_LABEL: Record<string, string> = {
  perdida_grasa: 'pérdida de grasa',
  fuerza: 'fuerza',
  cuerpo_completo: 'cuerpo completo',
  tren_superior: 'tren superior',
  tren_inferior: 'tren inferior',
  cardio: 'cardio',
  core: 'core',
};

export default function Progreso() {
  const colors = useTheme();
  const { cliente, actualizarCliente } = useSesion();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroProgreso[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [alturaCm, setAlturaCm] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [grasaCorporalPct, setGrasaCorporalPct] = useState('');

  const [recalculando, setRecalculando] = useState(false);
  const [mensajeRecalculo, setMensajeRecalculo] = useState<{ texto: string; esError: boolean } | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const datos = await progresoApi.listarProgreso();
      setRegistros(datos);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos cargar tu progreso');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function guardar() {
    setGuardando(true);
    try {
      if (!cliente?.alturaCm && alturaCm) {
        await progresoApi.actualizarAltura(Number(alturaCm));
        actualizarCliente?.({ alturaCm: Number(alturaCm) });
      }
      if (pesoKg || grasaCorporalPct) {
        await progresoApi.registrarProgreso({
          pesoKg: pesoKg ? Number(pesoKg) : undefined,
          grasaCorporalPct: grasaCorporalPct ? Number(grasaCorporalPct) : undefined,
        });
      }
      setPesoKg('');
      setGrasaCorporalPct('');
      setModalVisible(false);
      await cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function recalcular() {
    setRecalculando(true);
    setMensajeRecalculo(null);
    try {
      const resultado = await clientesApi.recalcularRutina();
      const objetivo = OBJETIVO_LABEL[resultado.objetivoCalculado] ?? resultado.objetivoCalculado;
      setMensajeRecalculo({
        texto: resultado.rutinaAsignada
          ? `Nuevo objetivo: ${objetivo}. Te asignamos "${resultado.rutinaAsignada.nombre}".`
          : `Nuevo objetivo: ${objetivo}. Tu gimnasio aún no tiene una rutina que combine bien, avísale a tu entrenador.`,
        esError: false,
      });
    } catch (e) {
      setMensajeRecalculo({
        texto: e instanceof ErrorApi ? e.message : 'No pudimos recalcular tu rutina',
        esError: true,
      });
    } finally {
      setRecalculando(false);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background, gap: Spacing.two }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.four }}>
          {error}
        </Text>
        <Pressable onPress={cargar} style={{ borderWidth: 1.5, borderColor: colors.tint, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const ultimo = registros[0];
  const anterior = registros[1];
  const cambioPeso = ultimo?.pesoKg && anterior?.pesoKg ? ultimo.pesoKg - anterior.pesoKg : null;
  const imc = ultimo?.pesoKg && cliente?.alturaCm ? calcularImc(ultimo.pesoKg, cliente.alturaCm) : null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <View style={styles.filaEntreItems}>
        <Text style={[styles.titulo, { color: colors.text }]}>Progreso</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.botonAgregar, { backgroundColor: colors.tint }]}>
          <Ionicons name="add" size={18} color={colors.tintForeground} />
        </Pressable>
      </View>

      <View style={styles.filaTarjetas}>
        <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Peso actual</Text>
          <Text style={[styles.valor, { color: colors.text }]}>{ultimo?.pesoKg ? `${ultimo.pesoKg} kg` : '—'}</Text>
          {cambioPeso !== null && (
            <Text style={{ color: cambioPeso <= 0 ? colors.tint : colors.danger, fontSize: 12, fontWeight: '700' }}>
              {cambioPeso > 0 ? '+' : ''}
              {cambioPeso.toFixed(1)} kg
            </Text>
          )}
        </View>
        <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>% Grasa corporal</Text>
          <Text style={[styles.valor, { color: colors.text }]}>
            {ultimo?.grasaCorporalPct ? `${ultimo.grasaCorporalPct}%` : '—'}
          </Text>
        </View>
      </View>

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>IMC</Text>
        {imc ? (
          <>
            <Text style={[styles.valor, { color: colors.text }]}>{imc.toFixed(1)}</Text>
            <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600' }}>{categoriaImc(imc)}</Text>
          </>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Agrega tu altura y peso para calcular tu IMC
          </Text>
        )}
      </View>

      {ultimo?.pesoKg && (
        <View style={styles.recalculoZona}>
          <Pressable
            onPress={recalcular}
            disabled={recalculando}
            style={[styles.botonRecalcular, { borderColor: colors.tint, opacity: recalculando ? 0.6 : 1 }]}>
            {recalculando ? (
              <ActivityIndicator color={colors.tint} size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={colors.tint} />
                <Text style={{ color: colors.tint, fontWeight: '700' }}>Recalcular mi rutina</Text>
              </>
            )}
          </Pressable>
          {mensajeRecalculo && (
            <Text
              style={{
                color: mensajeRecalculo.esError ? colors.danger : colors.textSecondary,
                fontSize: 13,
                marginTop: Spacing.one,
              }}>
              {mensajeRecalculo.texto}
            </Text>
          )}
        </View>
      )}

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>Historial</Text>
      <View style={{ gap: Spacing.two }}>
        {registros.map((registro) => (
          <View key={registro.id} style={[styles.filaHistorial, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, width: 70 }}>
              {new Date(registro.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </Text>
            <Text style={{ color: colors.text, flex: 1 }}>{registro.pesoKg ? `${registro.pesoKg} kg` : '—'}</Text>
            <Text style={{ color: colors.textSecondary }}>
              {registro.grasaCorporalPct ? `${registro.grasaCorporalPct}% grasa` : ''}
            </Text>
          </View>
        ))}
        {registros.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>
            Aún no tienes registros. Toca “+” para agregar tu primer control.
          </Text>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colors.background }]}>
            <View style={styles.filaEntreItems}>
              <Text style={[styles.seccionTitulo, { color: colors.text }]}>Nuevo registro</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {!cliente?.alturaCm && (
              <TextInput
                value={alturaCm}
                onChangeText={setAlturaCm}
                placeholder="Tu altura (cm)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            )}
            <TextInput
              value={pesoKg}
              onChangeText={setPesoKg}
              placeholder="Peso (kg)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              value={grasaCorporalPct}
              onChangeText={setGrasaCorporalPct}
              placeholder="% Grasa corporal (opcional)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <Pressable
              onPress={guardar}
              disabled={guardando || (!pesoKg && !grasaCorporalPct)}
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
  filaEntreItems: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botonAgregar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  filaTarjetas: { flexDirection: 'row', gap: Spacing.two },
  tarjeta: { flex: 1, borderRadius: 16, padding: Spacing.three, gap: 2 },
  valor: { fontSize: 22, fontWeight: '800' },
  seccionTitulo: { fontSize: 18, fontWeight: '800', marginTop: Spacing.two },
  recalculoZona: { alignItems: 'center' },
  botonRecalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
  },
  filaHistorial: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: Spacing.two },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContenido: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 15 },
  botonGuardar: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
});
