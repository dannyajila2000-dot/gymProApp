import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { Ejercicio } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function SustituirEjercicioModal({
  visible,
  onCerrar,
  rutinaEjercicioId,
  nombreActual,
  onSustituido,
}: {
  visible: boolean;
  onCerrar: () => void;
  rutinaEjercicioId: string;
  nombreActual: string;
  onSustituido: () => void;
}) {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [alternativas, setAlternativas] = useState<Ejercicio[]>([]);
  const [aplicando, setAplicando] = useState<string | null>(null);

  useEffect(() => {
    rutinasApi.listarAlternativas(rutinaEjercicioId).then((datos) => {
      setAlternativas(datos);
      setCargando(false);
    });
    // El padre desmonta y vuelve a montar este modal en cada apertura, así que
    // basta con cargar una sola vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function elegir(ejercicioId: string) {
    setAplicando(ejercicioId);
    try {
      await rutinasApi.sustituirEjercicio(rutinaEjercicioId, ejercicioId);
      onSustituido();
      onCerrar();
    } finally {
      setAplicando(null);
    }
  }

  async function restaurarOriginal() {
    setAplicando('__original__');
    try {
      await rutinasApi.quitarSustitucion(rutinaEjercicioId);
      onSustituido();
      onCerrar();
    } finally {
      setAplicando(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.encabezado}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titulo, { color: colors.text }]}>Sustituir ejercicio</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Actual: {nombreActual}</Text>
            </View>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <Pressable onPress={restaurarOriginal} disabled={!!aplicando} style={{ paddingVertical: Spacing.two }}>
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13.5 }}>
              {aplicando === '__original__' ? 'Restaurando...' : 'Restaurar ejercicio original'}
            </Text>
          </Pressable>

          {cargando ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: Spacing.four }} />
          ) : (
            <ScrollView contentContainerStyle={{ gap: Spacing.one, paddingBottom: Spacing.three }}>
              {alternativas.map((ejercicio) => (
                <Pressable
                  key={ejercicio.id}
                  disabled={!!aplicando}
                  onPress={() => elegir(ejercicio.id)}
                  style={[styles.fila, { backgroundColor: colors.backgroundElement }]}>
                  <MunecoEjercicio patron={ejercicio.patronMovimiento} color={colors.tint} size={30} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{ejercicio.nombre}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{ejercicio.grupoMuscular}</Text>
                  </View>
                  {aplicando === ejercicio.id && <ActivityIndicator color={colors.tint} size="small" />}
                </Pressable>
              ))}
              {alternativas.length === 0 && (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.three }}>
                  No hay alternativas disponibles para este ejercicio.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  contenido: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '75%',
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  titulo: { fontSize: 17, fontWeight: '800' },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    padding: Spacing.two,
  },
});
