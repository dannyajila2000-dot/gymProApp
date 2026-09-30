import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { Ejercicio } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Hoja "Añadir ejercicios": filtro por área, buscador y lista con selección.
 * Se puede tocar varios ejercicios seguidos; cada uno se agrega al momento y
 * queda marcado. "Cerrar" termina.
 */
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
  const [mostrarAreas, setMostrarAreas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [agregados, setAgregados] = useState<Set<string>>(new Set());

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

  function agregar(ejercicio: Ejercicio) {
    if (agregados.has(ejercicio.id)) return;
    setAgregados((actuales) => new Set(actuales).add(ejercicio.id));
    onAgregar(ejercicio);
  }

  const sinFiltros = !grupoActivo && !busqueda.trim();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.encabezado}>
            <Text style={[styles.titulo, { color: colors.text }]}>Añadir ejercicios</Text>
            <Pressable onPress={onCerrar} hitSlop={10} style={[styles.botonCerrar, { backgroundColor: colors.border }]}>
              <Ionicons name="close" size={20} color={colors.background} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => setMostrarAreas((v) => !v)}
            style={[styles.chipAreas, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="filter" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 15 }}>
              {grupoActivo ? grupoActivo : `Todas las áreas (${catalogo.length})`}
            </Text>
          </Pressable>

          {mostrarAreas && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filaChipsScroll}
              contentContainerStyle={styles.filaChips}>
              <Chip
                activo={grupoActivo === null}
                texto="Todas"
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
          )}

          <View style={[styles.buscador, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar ejercicios"
              placeholderTextColor={colors.textSecondary}
              style={[styles.buscadorTexto, { color: colors.text }]}
            />
          </View>

          {cargando ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: Spacing.four }} />
          ) : (
            // Sin flexShrink esta lista (potencialmente larga) se estira a su alto
            // natural en vez de encogerse dentro de la hoja con maxHeight.
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={styles.lista}>
              <Text style={[styles.etiquetaLista, { color: colors.tint }]}>
                {sinFiltros ? 'Recomendado' : `Resultados (${filtrados.length})`}
              </Text>
              {filtrados.map((ejercicio) => {
                const agregado = agregados.has(ejercicio.id);
                return (
                  <Pressable key={ejercicio.id} onPress={() => agregar(ejercicio)} style={styles.fila}>
                    {ejercicio.gifUrl ? (
                      <Image
                        source={{ uri: ejercicio.gifUrl }}
                        style={[styles.miniatura, { backgroundColor: colors.backgroundElement }]}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.miniatura, styles.miniaturaVacia, { backgroundColor: colors.backgroundElement }]}>
                        <MunecoEjercicio patron={ejercicio.patronMovimiento} color={colors.tint} size={32} />
                      </View>
                    )}
                    <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={2}>
                      {ejercicio.nombre.toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        { backgroundColor: agregado ? colors.tint : colors.border },
                      ]}>
                      {agregado && <Ionicons name="checkmark" size={16} color={colors.tintForeground} />}
                    </View>
                  </Pressable>
                );
              })}
              {filtrados.length === 0 && (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.three }}>
                  No encontramos ejercicios con ese filtro.
                </Text>
              )}
            </ScrollView>
          )}

          <Pressable onPress={onCerrar} style={[styles.botonCerrarGrande, { backgroundColor: colors.tint }]}>
            <Text style={{ color: colors.tintForeground, fontSize: 18, fontWeight: '800' }}>Cerrar</Text>
          </Pressable>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.four,
    height: '88%',
    gap: Spacing.three,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 22, fontWeight: '800' },
  botonCerrar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chipAreas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
  },
  filaChipsScroll: { flexShrink: 0, flexGrow: 0 },
  filaChips: { flexDirection: 'row', gap: Spacing.one, paddingBottom: 4 },
  chip: { borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 26,
    paddingHorizontal: Spacing.three,
  },
  buscadorTexto: { flex: 1, fontSize: 16, paddingVertical: 12 },
  lista: { paddingBottom: Spacing.three },
  etiquetaLista: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.one, paddingHorizontal: Spacing.two },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two, paddingHorizontal: Spacing.two },
  miniatura: { width: 76, height: 76, borderRadius: 12 },
  miniaturaVacia: { alignItems: 'center', justifyContent: 'center' },
  nombre: { flex: 1, fontSize: 17, fontWeight: '900' },
  radio: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  botonCerrarGrande: { borderRadius: 28, paddingVertical: 16, alignItems: 'center' },
});
