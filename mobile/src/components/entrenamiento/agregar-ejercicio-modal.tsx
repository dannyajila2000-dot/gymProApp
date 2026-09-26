import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import * as rutinasApi from '@/api/rutinas';
import type { Ejercicio } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function AgregarEjercicioModal({
  visible,
  onCerrar,
  onAgregar,
}: {
  visible: boolean;
  onCerrar: () => void;
  onAgregar: (ejercicio: Ejercicio) => void;
}) {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [catalogo, setCatalogo] = useState<Ejercicio[]>([]);
  const [grupoActivo, setGrupoActivo] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    rutinasApi.catalogoEjercicios().then((datos) => {
      setCatalogo(datos);
      setCargando(false);
    });
  }, []);

  const grupos = useMemo(() => [...new Set(catalogo.map((e) => e.grupoMuscular))], [catalogo]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return catalogo.filter(
      (e) =>
        (!grupoActivo || e.grupoMuscular === grupoActivo) &&
        (!texto || e.nombre.toLowerCase().includes(texto)),
    );
  }, [catalogo, grupoActivo, busqueda]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.encabezado}>
            <Text style={[styles.titulo, { color: colors.text }]}>Añadir ejercicio</Text>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar ejercicio..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.buscador, { borderColor: colors.border, color: colors.text }]}
          />

          {cargando ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: Spacing.four }} />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
                <Chip
                  activo={grupoActivo === null}
                  texto="Todos"
                  onPress={() => setGrupoActivo(null)}
                  colors={colors}
                />
                {grupos.map((grupo) => (
                  <Chip
                    key={grupo}
                    activo={grupoActivo === grupo}
                    texto={grupo}
                    onPress={() => setGrupoActivo((actual) => (actual === grupo ? null : grupo))}
                    colors={colors}
                  />
                ))}
              </ScrollView>

              <ScrollView contentContainerStyle={{ gap: Spacing.one, paddingBottom: Spacing.three }}>
                {filtrados.map((ejercicio) => (
                  <Pressable
                    key={ejercicio.id}
                    onPress={() => onAgregar(ejercicio)}
                    style={[styles.fila, { backgroundColor: colors.backgroundElement }]}>
                    <MunecoEjercicio patron={ejercicio.patronMovimiento} color={colors.tint} size={28} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{ejercicio.nombre}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{ejercicio.grupoMuscular}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={colors.tint} />
                  </Pressable>
                ))}
                {filtrados.length === 0 && (
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.three }}>
                    No encontramos ejercicios con ese filtro.
                  </Text>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Chip({
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
      <Text style={{ color: activo ? colors.tintForeground : colors.textSecondary, fontSize: 12.5, fontWeight: '700' }}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  contenido: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '85%',
    gap: Spacing.two,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '800' },
  buscador: { borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 10, fontSize: 14 },
  filaChips: { flexDirection: 'row', gap: Spacing.one, paddingBottom: 4 },
  chip: { borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 14, padding: Spacing.two },
});
