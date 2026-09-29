import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import * as progresoApi from '@/api/progreso';
import * as rutinasApi from '@/api/rutinas';
import type { DiaPlan } from '@/api/rutinas';
import { useSesion } from '@/context/auth-context';
import { DIAS_NOMBRE } from '@/constants/dias';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, Spacing } from '@/constants/theme';

const FOTOS_ENTRENANDO = [
  require('@/assets/images/dashboard/persona-entrenando-1-recorte.png'),
  require('@/assets/images/dashboard/persona-entrenando-2-recorte.png'),
  require('@/assets/images/dashboard/persona-entrenando-3-recorte.png'),
];
const FOTO_DESCANSO = require('@/assets/images/dashboard/dia-descanso-recorte.png');

export default function Inicio() {
  const colors = useTheme();
  const { cliente } = useSesion();

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [plan, setPlan] = useState<DiaPlan[]>([]);
  const [racha, setRacha] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const [semana, resumen] = await Promise.all([
        rutinasApi.obtenerPlanSemana(),
        progresoApi.resumenDeLaSemana(),
      ]);
      setPlan(semana);
      setRacha(resumen.racha);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function verRutinaDelDia(dia: DiaPlan) {
    if (!dia.rutinaId) {
      router.push('/(tabs)/rutina');
      return;
    }
    router.push({ pathname: '/rutinas/[rutinaId]', params: { rutinaId: dia.rutinaId } });
  }

  if (cargando) {
    return (
      <View style={[styles.contenedorCentro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const hoyIndice = plan.findIndex((d) => d.esHoy);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.contenedor}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargar();
          }}
          tintColor={colors.tint}
        />
      }>
      <View style={styles.filaEncabezado}>
        <View>
          <Text style={[styles.saludo, { color: colors.text }]}>Hola, {cliente?.nombres} 👋</Text>
          <Text style={{ color: colors.textSecondary }}>{cliente?.gimnasio}</Text>
        </View>
        {racha > 0 && (
          <View style={[styles.rachaTarjeta, CardShadow, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="flame" size={18} color={colors.tint} />
            <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 15 }}>{racha}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>Tu semana</Text>

      <View style={styles.lineaTiempo}>
        {plan.map((dia, indice) => (
          <View key={dia.fecha} style={styles.filaDia}>
            <View style={styles.columnaMarcador}>
              <View
                style={[
                  styles.marcador,
                  dia.completado
                    ? { backgroundColor: colors.tint, borderColor: colors.tint }
                    : dia.esHoy
                      ? { backgroundColor: colors.background, borderColor: colors.tint }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                ]}>
                {dia.completado && <Ionicons name="checkmark" size={12} color={colors.tintForeground} />}
              </View>
              {indice < plan.length - 1 && (
                <View style={styles.lineaVerticalContenedor}>
                  <Svg width="100%" height="100%">
                    <Line x1="50%" y1="0" x2="50%" y2="100%" stroke={colors.border} strokeWidth={2} strokeDasharray="4,6" />
                  </Svg>
                </View>
              )}
            </View>

            <DiaTarjeta
              dia={dia}
              foto={dia.esDiaEntrenamiento ? FOTOS_ENTRENANDO[indice % FOTOS_ENTRENANDO.length] : FOTO_DESCANSO}
              onVerRutina={() => verRutinaDelDia(dia)}
              colors={colors}
            />
          </View>
        ))}
      </View>

      {hoyIndice === -1 && (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.two }}>
          No pudimos ubicar el día de hoy en tu semana.
        </Text>
      )}
    </ScrollView>
  );
}

function DiaTarjeta({
  dia,
  foto,
  onVerRutina,
  colors,
}: {
  dia: DiaPlan;
  foto: number;
  onVerRutina: () => void;
  colors: ReturnType<typeof useTheme>;
}) {
  const destacar = dia.esHoy && !dia.completado;

  if (!dia.esDiaEntrenamiento) {
    return (
      <View style={[styles.tarjetaDia, CardShadow]}>
        <View style={styles.tarjetaFondo}>
          <LinearGradient
            colors={[colors.backgroundElement, colors.energiaSuave]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {/* La foto va SIN recorte (overflow visible) para que "salga" del borde de la tarjeta. */}
        <Image source={foto} style={styles.foto} contentFit="contain" />
        <View style={styles.textoContenedor}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
            {DIAS_NOMBRE[dia.diaSemana]} {dia.fecha.slice(8, 10)}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>¡Día de descanso!</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={onVerRutina} style={[styles.tarjetaDia, CardShadow]}>
      <View style={styles.tarjetaFondo}>
        {destacar && (
          <LinearGradient
            colors={[colors.energia, colors.energiaOscuro]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {dia.completado && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.tint },
            ]}
          />
        )}
        {!destacar && !dia.completado && (
          <LinearGradient
            colors={[colors.backgroundElement, colors.energiaSuave]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>

      {/* La foto se pinta antes que el texto/botón para que ellos queden por
          encima donde se monten — así el botón "corta" la silueta como en la
          referencia, en vez de taparla por completo. */}
      <Image source={foto} style={styles.foto} contentFit="contain" />

      <View style={styles.textoContenedor}>
        <Text style={{ color: destacar ? '#ffffff' : colors.text, fontWeight: '700', fontSize: 16 }}>
          {DIAS_NOMBRE[dia.diaSemana]} {dia.fecha.slice(8, 10)}
        </Text>
        <Text
          style={{
            color: destacar ? '#ffffff' : colors.textSecondary,
            fontSize: 13.5,
            opacity: destacar ? 0.9 : 1,
          }}>
          {dia.completado ? '¡Completado!' : (dia.rutinaNombre ?? 'Sin rutina disponible')}
        </Text>
      </View>

      {destacar && (
        <View style={styles.botonComenzar}>
          <Text style={styles.botonComenzarTexto} numberOfLines={1}>
            {dia.rutinaId ? 'Ver rutina y comenzar' : 'Elegir rutina'}
          </Text>
          <View style={styles.botonComenzarFlecha}>
            <Ionicons name="arrow-forward" size={15} color="#ffffff" />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedorCentro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: { padding: Spacing.four, paddingBottom: Spacing.six },
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.two,
  },
  saludo: { fontSize: 24, fontWeight: '800' },
  rachaTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  seccionTitulo: { fontSize: 18, fontWeight: '800', marginTop: Spacing.five, marginBottom: Spacing.two },
  lineaTiempo: { gap: 0 },
  filaDia: { flexDirection: 'row', gap: Spacing.two },
  columnaMarcador: { alignItems: 'center', width: 20 },
  marcador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineaVerticalContenedor: { flex: 1, width: 2, marginVertical: 2 },
  // Sin overflow:hidden aquí a propósito — la foto necesita "salirse" del
  // borde de la tarjeta para el efecto 3D. Lo que sí debe recortarse (el
  // degradado/color de fondo) vive dentro de `tarjetaFondo`, que sí lo tiene.
  tarjetaDia: {
    flex: 1,
    minHeight: 154,
    marginBottom: Spacing.three,
  },
  tarjetaFondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    overflow: 'hidden',
  },
  foto: {
    position: 'absolute',
    width: 138,
    height: 176,
    top: -28,
    right: -10,
  },
  textoContenedor: {
    position: 'absolute',
    top: Spacing.four,
    left: Spacing.three,
    right: 112,
  },
  botonComenzar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingLeft: 18,
    paddingRight: 8,
    backgroundColor: '#ffffff',
  },
  botonComenzarTexto: { color: '#1F2430', fontWeight: '800', flexShrink: 1, fontSize: 12.5 },
  botonComenzarFlecha: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
});
