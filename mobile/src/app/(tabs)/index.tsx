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
import { CambiarRutinaDiaModal } from '@/components/rutinas/cambiar-rutina-dia-modal';
import { useSesion } from '@/context/auth-context';
import { resincronizarConPlan } from '@/lib/notificaciones';
import { DIAS_NOMBRE, DIAS_NOMBRE_LARGO } from '@/constants/dias';
import { AvisoMembresia } from '@/components/membresia/aviso-membresia';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, FotoFlotanteShadow, Spacing } from '@/constants/theme';

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
  const [cambiandoDia, setCambiandoDia] = useState<number | null>(null);
  const [editandoSemana, setEditandoSemana] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [semana, resumen] = await Promise.all([
        rutinasApi.obtenerPlanSemana(),
        progresoApi.resumenDeLaSemana(),
      ]);
      setPlan(semana);
      // Mantiene los recordatorios con la rutina que toca; un fallo no debe afectar Inicio.
      resincronizarConPlan(semana).catch(() => {});
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

  // Los días anteriores a hoy ya pasaron: quedan bloqueados (sin cambiar rutina).
  const indiceHoy = plan.findIndex((d) => d.esHoy);
  const esPasado = (indice: number) => indiceHoy !== -1 && indice < indiceHoy;

  function verRutinaDelDia(dia: DiaPlan) {
    if (!dia.rutinaId) {
      setCambiandoDia(dia.diaSemana);
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
      <AvisoMembresia />

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

      <View style={styles.filaSeccion}>
        <Text style={[styles.seccionTitulo, styles.seccionTituloEnFila, { color: colors.text }]}>Tu semana</Text>
        <Pressable onPress={() => setEditandoSemana((v) => !v)} hitSlop={8} style={styles.botonEditarSemana}>
          <Ionicons name={editandoSemana ? 'chevron-up' : 'calendar-outline'} size={16} color={colors.tint} />
          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>
            {editandoSemana ? 'Cerrar' : 'Editar mi semana'}
          </Text>
        </Pressable>
      </View>

      {editandoSemana && (
        <View style={[styles.panelSemana, CardShadow, { backgroundColor: colors.backgroundElement }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
            Cada día tiene una rutina: la automática según tu nivel y objetivo, o la que elijas tú. Toca un día para
            cambiarla.
          </Text>
          {plan.map((dia, indice) => (
            <Pressable
              key={dia.diaSemana}
              disabled={esPasado(indice)}
              onPress={() => setCambiandoDia(dia.diaSemana)}
              style={[styles.filaEdicionDia, { borderColor: colors.border, opacity: esPasado(indice) ? 0.5 : 1 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {DIAS_NOMBRE_LARGO[dia.diaSemana]}
                  {dia.esHoy ? ' · hoy' : ''}
                </Text>
                <Text
                  style={{ color: dia.fijadaPorCliente ? colors.tint : colors.textSecondary, fontSize: 12.5, marginTop: 2 }}
                  numberOfLines={1}>
                  {dia.rutinaNombre
                    ? `${dia.fijadaPorCliente ? 'Personalizada' : 'Automática'}: ${dia.rutinaNombre}`
                    : 'Descanso'}
                </Text>
              </View>
              <Ionicons
                name={esPasado(indice) ? 'lock-closed' : 'chevron-forward'}
                size={esPasado(indice) ? 16 : 18}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.lineaTiempo}>
        {plan.map((dia, indice) => (
          <View key={dia.fecha} style={styles.filaDia}>
            <View style={styles.columnaMarcador}>
              <View
                style={[
                  styles.marcador,
                  dia.completado
                    ? { backgroundColor: colors.tintFondo, borderColor: colors.tintFondo }
                    : dia.esHoy
                      ? { backgroundColor: colors.background, borderColor: colors.tintFondo }
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
              onCambiarRutina={() => setCambiandoDia(dia.diaSemana)}
              pasado={esPasado(indice)}
              colors={colors}
            />
          </View>
        ))}
      </View>

      {cambiandoDia !== null && (
        <CambiarRutinaDiaModal diaSemana={cambiandoDia} onCerrar={() => setCambiandoDia(null)} onListo={cargar} />
      )}

      {hoyIndice === -1 && (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.two }}>
          No pudimos ubicar el día de hoy en tu semana.
        </Text>
      )}
    </ScrollView>
  );
}

function BarraProgreso({ pct, colorFondo, colorRelleno }: { pct: number; colorFondo: string; colorRelleno: string }) {
  return (
    <View style={[styles.barraFondo, { backgroundColor: colorFondo }]}>
      <View style={[styles.barraRelleno, { backgroundColor: colorRelleno, width: `${Math.min(100, Math.max(0, pct))}%` }]} />
    </View>
  );
}

function DiaTarjeta({
  dia,
  foto,
  onVerRutina,
  onCambiarRutina,
  pasado,
  colors,
}: {
  dia: DiaPlan;
  foto: number;
  onVerRutina: () => void;
  onCambiarRutina: () => void;
  pasado: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  const destacar = dia.esHoy && !dia.completado;
  const tieneStats = dia.duracionMin != null && dia.caloriasEstimadas != null;

  if (!dia.esDiaEntrenamiento) {
    return (
      <View style={[styles.tarjetaDia, CardShadow, pasado && { opacity: 0.55 }]}>
        <View style={styles.tarjetaFondo}>
          <LinearGradient
            colors={[colors.backgroundElement, colors.energiaSuave]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {/* La foto va SIN recorte (overflow visible) para que "salga" del borde de la tarjeta. */}
        <Image source={foto} style={[styles.foto, FotoFlotanteShadow]} contentFit="contain" />
        <View style={styles.contenido}>
          <View style={{ paddingRight: 100 }}>
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 11.5, opacity: 0.85 }}>
              Día {dia.numeroDia}
            </Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
              {DIAS_NOMBRE[dia.diaSemana]} {dia.fecha.slice(8, 10)}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>¡Día de descanso!</Text>
            {pasado ? (
              <View style={styles.botonCambiar}>
                <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12.5 }}>Día pasado</Text>
              </View>
            ) : (
              <Pressable onPress={onCambiarRutina} hitSlop={8} style={styles.botonCambiar}>
                <Ionicons name="add-circle-outline" size={14} color={colors.tint} />
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12.5 }}>Elegir una rutina</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onVerRutina}
      disabled={pasado}
      style={[styles.tarjetaDia, CardShadow, pasado && !dia.completado && { opacity: 0.55 }]}>
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
              { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.tintFondo },
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

      {/* La foto se pinta antes que el contenido para que el texto/barra/botón
          queden por encima donde se monten — así se "cortan" la silueta como
          en la referencia, en vez de taparla por completo. */}
      <Image source={foto} style={[styles.foto, FotoFlotanteShadow]} contentFit="contain" />

      <View style={styles.contenido}>
        {/* Este bloque (texto + stats + barra) se queda angosto a propósito
            (paddingRight) para no meterse debajo de la foto. */}
        <View style={{ paddingRight: 100 }}>
          <Text
            style={{
              color: destacar ? colors.tintForeground : colors.tint,
              fontWeight: '700',
              fontSize: 11.5,
              opacity: destacar ? 0.85 : 0.85,
            }}>
            Día {dia.numeroDia}
          </Text>
          <Text style={{ color: destacar ? colors.tintForeground : colors.text, fontWeight: '700', fontSize: 16 }}>
            {DIAS_NOMBRE[dia.diaSemana]} {dia.fecha.slice(8, 10)}
          </Text>
          <Text
            style={{
              color: destacar ? colors.tintForeground : colors.textSecondary,
              fontSize: 13.5,
              opacity: destacar ? 0.9 : 1,
            }}>
            {dia.completado ? '¡Completado!' : (dia.rutinaNombre ?? 'Sin rutina disponible')}
          </Text>

          {tieneStats && (
            <>
              <Text
                style={{
                  color: destacar ? colors.tintForeground : colors.textSecondary,
                  opacity: destacar ? 0.9 : 1,
                  fontSize: 12.5,
                  fontWeight: '600',
                  marginTop: Spacing.two,
                }}>
                {dia.duracionMin} min · {dia.caloriasEstimadas} kcal
              </Text>
              <Text
                style={{
                  color: destacar ? colors.tintForeground : colors.text,
                  fontSize: 11.5,
                  fontWeight: '800',
                  marginTop: Spacing.two,
                }}>
                {dia.progresoPct}%
              </Text>
              <BarraProgreso
                pct={dia.progresoPct}
                colorFondo={destacar ? 'rgba(255,255,255,0.28)' : colors.backgroundSelected}
                colorRelleno={destacar ? colors.tintForeground : colors.tint}
              />
            </>
          )}

          {pasado && !dia.completado && (
            <View style={styles.botonCambiar}>
              <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12.5 }}>Día pasado</Text>
            </View>
          )}

          {!dia.completado && !pasado && (
            <Pressable onPress={onCambiarRutina} hitSlop={8} style={styles.botonCambiar}>
              <Ionicons name="swap-horizontal" size={14} color={destacar ? colors.tintForeground : colors.tint} />
              <Text style={{ color: destacar ? colors.tintForeground : colors.tint, fontWeight: '700', fontSize: 12.5 }}>
                {dia.fijadaPorCliente ? 'Personalizada · Cambiar' : 'Automática · Cambiar'}
              </Text>
            </Pressable>
          )}
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
      </View>
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
  botonCambiar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.two },
  filaSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  seccionTituloEnFila: { marginTop: 0, marginBottom: 0 },
  botonEditarSemana: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panelSemana: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  filaEdicionDia: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  seccionTitulo: { fontSize: 18, fontWeight: '800', marginTop: Spacing.five, marginBottom: Spacing.two },
  // paddingTop deja aire para que la foto de la primera tarjeta pueda
  // "salirse" hacia arriba sin encimarse con el título de la sección.
  lineaTiempo: { gap: 0, paddingTop: Spacing.four },
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
  // La altura ya no es fija: la define `contenido` (en flujo normal), así
  // que crece solo si hace falta más espacio para las stats/barra/botón.
  tarjetaDia: {
    flex: 1,
    // Más separación que un margen normal: deja aire para que la foto de la
    // tarjeta de abajo se salga hacia arriba sin encimarse con esta.
    marginBottom: 44,
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
    width: 150,
    height: 194,
    top: -38,
    right: -14,
  },
  // En flujo normal (no absoluto): es lo que le da altura real a la tarjeta.
  contenido: {
    padding: Spacing.three,
    paddingTop: Spacing.four,
    minHeight: 150,
  },
  barraFondo: {
    height: 4,
    width: '70%',
    borderRadius: 2,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  barraRelleno: { height: '100%', borderRadius: 2 },
  botonComenzar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingLeft: 18,
    paddingRight: 8,
    backgroundColor: '#ffffff',
    marginTop: Spacing.three,
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
