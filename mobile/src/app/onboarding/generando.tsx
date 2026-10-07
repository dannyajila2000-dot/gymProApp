import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { completarOnboarding } from '@/api/clientes';
import { ErrorApi } from '@/api/client';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const RADIO = 90;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

const PASOS = [
  'Analizando tus respuestas y tu nivel...',
  'Cuidando tus lesiones y tu disponibilidad...',
  'Eligiendo las rutinas que mejor te quedan...',
];

export default function Generando() {
  const colors = useTheme();
  const { respuestas, resultado, guardarResultado } = useOnboarding();
  const [porcentaje, setPorcentaje] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  const yaTermino = useRef(false);

  useEffect(() => {
    let cancelado = false;
    yaTermino.current = false;

    const intervalo = setInterval(() => {
      setPorcentaje((actual) => (actual < 90 && !yaTermino.current ? actual + 3 : actual));
    }, 100);

    async function ejecutar() {
      try {
        // Si ya se envió (por ejemplo, al volver atrás hasta aquí), no se repite: duplicaría el recordatorio y el peso.
        if (!resultado) {
          if (!respuestas.nivelFitness || !respuestas.restriccionFisica) {
            throw new Error('Faltan datos del formulario');
          }
          const enviado = await completarOnboarding({
            nivelFitness: respuestas.nivelFitness,
            nivelActividad: respuestas.nivelActividad,
            alturaCm: Math.round(respuestas.alturaCm),
            pesoActualKg: respuestas.pesoActualKg,
            pesoObjetivoKg: respuestas.pesoObjetivoKg,
            restriccionFisica: respuestas.restriccionFisica,
            objetivoPrincipal: respuestas.objetivoPrincipal ?? undefined,
            historialEntrenamiento: respuestas.historialEntrenamiento ?? undefined,
            frecuenciaSemanal: respuestas.frecuenciaSemanal ?? undefined,
            diasEntrenamiento: respuestas.diasEntrenamiento.length ? respuestas.diasEntrenamiento : undefined,
            horaEntrenamiento: respuestas.horaEntrenamiento,
            recordarme: respuestas.recordarme,
            zonasLesion: respuestas.zonasLesion,
            sucursalId: respuestas.sucursalId ?? undefined,
          });
          if (cancelado) return;
          guardarResultado({
            recomendaciones: enviado.recomendaciones ?? [],
            rutinaAsignadaId: enviado.rutinaAsignada?.id ?? null,
          });
        }
        yaTermino.current = true;
        setPorcentaje(100);
        // Aún no se marca el onboarding como completado en el teléfono: si no, la app saldría de este flujo
        // antes de que el cliente elija su rutina. Lo hace la pantalla de recomendaciones.
        setTimeout(() => {
          if (!cancelado) router.replace('/onboarding/recomendaciones');
        }, 600);
      } catch (e) {
        if (cancelado) return;
        yaTermino.current = true;
        setError(e instanceof ErrorApi ? e.message : 'No pudimos guardar tus datos');
      }
    }

    ejecutar();

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
    // Solo debe correr al entrar y al reintentar; las respuestas ya no cambian en esta pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentos]);

  if (error) {
    return (
      <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.three }}>
          {error}
        </Text>
        <Pressable
          onPress={() => {
            setError(null);
            setPorcentaje(0);
            setIntentos((n) => n + 1);
          }}
          style={[styles.botonReintentar, { borderColor: colors.tintFondo }]}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const offset = CIRCUNFERENCIA * (1 - porcentaje / 100);

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="barbell" size={40} color={colors.tint} />
      </View>

      <Text style={[styles.titulo, { color: colors.text }]}>Generando tu plan...</Text>

      <View style={styles.anilloContenedor}>
        <Svg width={220} height={220}>
          <Circle cx={110} cy={110} r={RADIO} stroke={colors.border} strokeWidth={14} fill="none" />
          <Circle
            cx={110}
            cy={110}
            r={RADIO}
            stroke={colors.tintFondo}
            strokeWidth={14}
            fill="none"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 110 110)"
          />
        </Svg>
        <Text style={[styles.porcentaje, { color: colors.text }]}>{Math.min(100, Math.round(porcentaje))}%</Text>
      </View>

      <View style={styles.pasos}>
        {PASOS.map((texto, indice) => {
          const listo = porcentaje >= ((indice + 1) / PASOS.length) * 100;
          return (
            <View key={texto} style={styles.filaPaso}>
              <Ionicons
                name={listo ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={listo ? colors.tint : colors.textSecondary}
              />
              <Text style={{ color: listo ? colors.text : colors.textSecondary }}>{texto}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.five,
  },
  anilloContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  porcentaje: {
    position: 'absolute',
    fontSize: 36,
    fontWeight: '800',
  },
  pasos: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  filaPaso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  botonReintentar: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
