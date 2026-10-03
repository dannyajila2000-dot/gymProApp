import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Rutina } from '@/api/rutinas';
import { RutinaFila } from '@/components/rutinas/tarjetas-rutina';
import {
  CATEGORIA_MIS_RUTINAS,
  CATEGORIA_PARA_TI,
  CATEGORIAS,
  cumpleDuracion,
  DURACIONES,
} from '@/constants/categorias-rutinas';
import { NIVEL_LABEL } from '@/constants/niveles';
import { Spacing } from '@/constants/theme';
import { useCatalogoRutinas } from '@/hooks/use-catalogo-rutinas';
import { useTheme } from '@/hooks/use-theme';

// Busca sin importar mayúsculas ni tildes.
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const PESTANAS = [
  { clave: CATEGORIA_PARA_TI, titulo: 'Elegido para ti' },
  ...Object.entries(CATEGORIAS).map(([clave, { titulo }]) => ({ clave, titulo })),
  { clave: CATEGORIA_MIS_RUTINAS, titulo: 'Mis rutinas' },
];

export default function Categorias() {
  const colors = useTheme();
  const params = useLocalSearchParams<{ categoria?: string; nivel?: string; duracion?: string; buscar?: string }>();
  const { cargando, disponibles, propias, paraTi } = useCatalogoRutinas();

  const [categoria, setCategoria] = useState(params.categoria ?? CATEGORIA_PARA_TI);
  const [nivel, setNivel] = useState(params.nivel);
  const [duracion, setDuracion] = useState(params.duracion);
  const [busqueda, setBusqueda] = useState('');

  const barraRef = useRef<ScrollView>(null);
  const posiciones = useRef<Record<string, number>>({});

  function elegirPestana(clave: string) {
    setCategoria(clave);
    barraRef.current?.scrollTo({ x: Math.max(0, (posiciones.current[clave] ?? 0) - Spacing.four), animated: true });
  }

  const texto = normalizar(busqueda.trim());
  const buscando = texto.length > 0;
  // Con texto, busca en todas las rutinas (del gimnasio y propias), sin importar la pestaña.
  const base: Rutina[] = buscando
    ? [...disponibles, ...propias].filter((r) => normalizar(r.nombre).includes(texto))
    : categoria === CATEGORIA_PARA_TI
      ? paraTi
      : categoria === CATEGORIA_MIS_RUTINAS
        ? propias
        : disponibles.filter((r) => r.objetivo === categoria);
  const rutinas = base.filter((r) => (!nivel || r.nivel === nivel) && cumpleDuracion(r, duracion));
  const hayFiltros = !!nivel || !!duracion;

  function abrir(rutina: Rutina) {
    if (rutina.creadaPorClienteId) {
      router.push({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: rutina.id } });
    } else {
      router.push({ pathname: '/rutinas/[rutinaId]', params: { rutinaId: rutina.id } });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.titulo, { color: colors.text }]}>Categorías</Text>
      </View>

      <View style={[styles.buscador, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          autoFocus={params.buscar === '1'}
          placeholder="Buscar rutinas"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          style={[styles.buscadorTexto, { color: colors.text }]}
        />
        {busqueda.length > 0 && (
          <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={[styles.barraWrap, { borderColor: colors.border }]}>
        <ScrollView ref={barraRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barra}>
          {PESTANAS.map((pestana) => {
            const activa = !buscando && pestana.clave === categoria;
            return (
              <Pressable
                key={pestana.clave}
                onPress={() => elegirPestana(pestana.clave)}
                onLayout={(e) => {
                  posiciones.current[pestana.clave] = e.nativeEvent.layout.x;
                }}
                style={styles.pestana}>
                <Text
                  style={[
                    styles.pestanaTexto,
                    { color: activa ? colors.tint : colors.textSecondary, fontWeight: activa ? '800' : '600' },
                  ]}>
                  {pestana.titulo}
                </Text>
                <View style={[styles.subrayado, { backgroundColor: activa ? colors.tintFondo : 'transparent' }]} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {hayFiltros && (
        <View style={styles.filtros}>
          {nivel && (
            <Pressable
              onPress={() => setNivel(undefined)}
              style={[styles.chip, { backgroundColor: colors.backgroundSelected }]}>
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>{NIVEL_LABEL[nivel] ?? nivel}</Text>
              <Ionicons name="close" size={14} color={colors.tint} />
            </Pressable>
          )}
          {duracion && (
            <Pressable
              onPress={() => setDuracion(undefined)}
              style={[styles.chip, { backgroundColor: colors.backgroundSelected }]}>
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>
                {DURACIONES[duracion]?.titulo ?? duracion}
              </Text>
              <Ionicons name="close" size={14} color={colors.tint} />
            </Pressable>
          )}
        </View>
      )}

      {cargando ? (
        <ActivityIndicator color={colors.tint} size="large" style={{ marginTop: Spacing.five }} />
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {rutinas.map((rutina, indice) => (
            <RutinaFila key={rutina.id} rutina={rutina} conSeparador={indice < rutinas.length - 1} onPress={() => abrir(rutina)} />
          ))}
          {rutinas.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.five }}>
              {buscando
                ? 'No encontramos rutinas con ese nombre.'
                : categoria === CATEGORIA_MIS_RUTINAS
                ? 'Aún no has creado rutinas. Crea la tuya desde Rutinas con "CREA EL TUYO".'
                : hayFiltros
                  ? 'Ninguna rutina combina con estos filtros.'
                  : 'Aún no hay rutinas en esta categoría.'}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
  },
  titulo: { fontSize: 22, fontWeight: '800' },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
  },
  buscadorTexto: { flex: 1, fontSize: 16, paddingVertical: 11 },
  barraWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  barra: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  pestana: { alignItems: 'center', paddingTop: Spacing.two },
  pestanaTexto: { fontSize: 17, paddingBottom: Spacing.two },
  subrayado: { height: 3, width: 28, borderRadius: 2 },
  filtros: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  lista: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.six },
});
