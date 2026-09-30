import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { Rutina } from '@/api/rutinas';
import { RutinaFila, RutinaTarjetaCarrusel } from '@/components/rutinas/tarjetas-rutina';
import {
  CATEGORIA_MIS_RUTINAS,
  CATEGORIA_PARA_TI,
  CATEGORIAS,
  CATEGORIAS_CARRUSEL,
  DURACIONES,
  ZONAS,
} from '@/constants/categorias-rutinas';
import { NIVEL_LABEL } from '@/constants/niveles';
import { Spacing } from '@/constants/theme';
import { useCatalogoRutinas } from '@/hooks/use-catalogo-rutinas';
import { useTheme } from '@/hooks/use-theme';

type Parametros = { categoria?: string; nivel?: string; duracion?: string; buscar?: string };

function abrirCategorias(parametros: Parametros = {}) {
  router.push({ pathname: '/rutinas/categorias', params: parametros });
}

export default function Descubre() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const { cargando, disponibles, propias, paraTi } = useCatalogoRutinas();

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const anchoTarjeta = width * 0.78;
  const anchoColumnaParaTi = width * 0.86;
  const porObjetivo = (objetivo: string) => disponibles.filter((r) => r.objetivo === objetivo);
  const zonasConRutinas = ZONAS.filter((z) => porObjetivo(z).length > 0);
  const carruseles = CATEGORIAS_CARRUSEL.filter((c) => porObjetivo(c).length > 0);

  // "Elegido para ti" se muestra de a 2 filas por columna, como un carrusel.
  const columnasParaTi: Rutina[][] = [];
  for (let i = 0; i < paraTi.length; i += 2) columnasParaTi.push(paraTi.slice(i, i + 2));

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <View style={styles.filaTitulo}>
        <Text style={[styles.titulo, { color: colors.text }]}>Rutinas</Text>
        <Pressable onPress={() => router.push('/rutinas/historial')} hitSlop={10}>
          <Ionicons name="time-outline" size={28} color={colors.text} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => abrirCategorias({ buscar: '1' })}
        style={[styles.buscador, styles.margenLateral, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Buscar rutinas</Text>
      </Pressable>

      {zonasConRutinas.length > 0 && (
        <>
          <Text style={[styles.seccionTitulo, styles.margenLateral, { color: colors.text }]}>Zona principal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
            {zonasConRutinas.map((zona) => {
              const foto = porObjetivo(zona)[0];
              const uri = foto.imagenUrl ?? foto.ejercicios[0]?.ejercicio.gifUrl ?? null;
              return (
                <Pressable key={zona} onPress={() => abrirCategorias({ categoria: zona })} style={styles.zona}>
                  <View style={[styles.zonaCirculo, { backgroundColor: colors.backgroundSelected }]}>
                    {uri ? (
                      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Ionicons name={CATEGORIAS[zona].icono} size={32} color={colors.tint} />
                    )}
                  </View>
                  <Text style={[styles.zonaNombre, { color: colors.text }]} numberOfLines={2}>
                    {CATEGORIAS[zona].titulo}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {paraTi.length > 0 && (
        <>
          <Text style={[styles.seccionTitulo, styles.margenLateral, { color: colors.text }]}>Elegido para ti</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
            {columnasParaTi.map((columna, indice) => (
              <View key={indice} style={{ width: anchoColumnaParaTi }}>
                {columna.map((rutina, fila) => (
                  <RutinaFila
                    key={rutina.id}
                    rutina={rutina}
                    conSeparador={fila < columna.length - 1}
                    onPress={() => abrirCategorias({ categoria: CATEGORIA_PARA_TI })}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {carruseles.map((categoria) => (
        <View key={categoria}>
          <View style={[styles.filaSeccion, styles.margenLateral]}>
            <Text style={[styles.seccionTitulo, styles.sinMargen, { color: colors.text }]}>
              {CATEGORIAS[categoria].titulo}
            </Text>
            <Pressable onPress={() => abrirCategorias({ categoria })} hitSlop={8}>
              <Text style={[styles.mas, { color: colors.tint }]}>Más</Text>
            </Pressable>
          </View>
          <Carrusel rutinas={porObjetivo(categoria)} ancho={anchoTarjeta} onPress={() => abrirCategorias({ categoria })} />
        </View>
      ))}

      {propias.length > 0 && (
        <View>
          <View style={[styles.filaSeccion, styles.margenLateral]}>
            <Text style={[styles.seccionTitulo, styles.sinMargen, { color: colors.text }]}>Mis rutinas</Text>
            <Pressable onPress={() => abrirCategorias({ categoria: CATEGORIA_MIS_RUTINAS })} hitSlop={8}>
              <Text style={[styles.mas, { color: colors.tint }]}>Más</Text>
            </Pressable>
          </View>
          <Carrusel
            rutinas={propias}
            ancho={anchoTarjeta}
            onPress={() => abrirCategorias({ categoria: CATEGORIA_MIS_RUTINAS })}
          />
        </View>
      )}

      <Text style={[styles.seccionTitulo, styles.margenLateral, { color: colors.text }]}>Diseña entrenamientos</Text>
      <Pressable onPress={() => router.push('/rutinas/disenar')} style={styles.margenLateral}>
        <LinearGradient
          colors={[colors.energia, colors.energiaOscuro]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}>
          <Ionicons name="barbell" size={120} color="rgba(255,255,255,0.18)" style={styles.bannerIcono} />
          <Text style={styles.bannerTexto}>CREA EL TUYO</Text>
          <View style={styles.bannerBoton}>
            <Text style={[styles.bannerBotonTexto, { color: colors.text }]}>VAMOS</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <Text style={[styles.seccionTitulo, styles.margenLateral, { color: colors.text }]}>Niveles</Text>
      <View style={[styles.filaTarjetas, styles.margenLateral]}>
        {Object.keys(NIVEL_LABEL).map((nivel, indice) => (
          <Pressable
            key={nivel}
            onPress={() => abrirCategorias({ nivel })}
            style={[styles.tarjetaFiltro, { backgroundColor: indice === 1 ? colors.backgroundSelected : colors.energiaSuave }]}>
            <View style={styles.barras}>
              {[0, 1, 2].map((barra) => (
                <View
                  key={barra}
                  style={[
                    styles.barra,
                    { height: 8 + barra * 5, backgroundColor: barra <= indice ? colors.tint : colors.border },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.tarjetaFiltroTexto, { color: colors.text }]}>{NIVEL_LABEL[nivel]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.seccionTitulo, styles.margenLateral, { color: colors.text }]}>Duración</Text>
      <View style={[styles.filaTarjetas, styles.margenLateral]}>
        {Object.entries(DURACIONES).map(([clave, duracion]) => (
          <Pressable
            key={clave}
            onPress={() => abrirCategorias({ duracion: clave })}
            style={[styles.tarjetaFiltro, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="time-outline" size={20} color={colors.tint} />
            <Text style={[styles.tarjetaFiltroTexto, { color: colors.text }]}>{duracion.titulo}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.creditos, { color: colors.textSecondary }]}>
        Fotos de ejercicios: free-exercise-db (dominio público) y wger.de (CC BY-SA)
      </Text>
    </ScrollView>
  );
}

function Carrusel({ rutinas, ancho, onPress }: { rutinas: Rutina[]; ancho: number; onPress: () => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={ancho + Spacing.three}
      decelerationRate="fast"
      contentContainerStyle={styles.carrusel}>
      {rutinas.map((rutina) => (
        <RutinaTarjetaCarrusel key={rutina.id} rutina={rutina} ancho={ancho} onPress={onPress} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: { paddingTop: Spacing.four, paddingBottom: Spacing.six },
  margenLateral: { marginHorizontal: Spacing.four },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  titulo: { fontSize: 28, fontWeight: '800' },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    marginTop: Spacing.three,
  },
  seccionTitulo: { fontSize: 21, fontWeight: '800', marginTop: Spacing.five, marginBottom: Spacing.three },
  sinMargen: { marginTop: 0, marginBottom: 0 },
  filaSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
  },
  mas: { fontSize: 16, fontWeight: '700' },
  carrusel: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  zona: { width: 84, alignItems: 'center', gap: Spacing.two },
  zonaCirculo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonaNombre: { fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  banner: {
    height: 110,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  bannerIcono: { position: 'absolute', right: -10, bottom: -20 },
  bannerTexto: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  bannerBoton: { backgroundColor: '#ffffff', borderRadius: 22, paddingVertical: 12, paddingHorizontal: 22 },
  bannerBotonTexto: { fontSize: 16, fontWeight: '900' },
  filaTarjetas: { flexDirection: 'row', gap: Spacing.two },
  tarjetaFiltro: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  tarjetaFiltroTexto: { fontSize: 14, fontWeight: '700' },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  barra: { width: 5, borderRadius: 2 },
  creditos: { fontSize: 11, textAlign: 'center', marginTop: Spacing.five, marginHorizontal: Spacing.four },
});
