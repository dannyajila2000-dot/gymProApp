import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { completarOnboarding } from '@/api/clientes';
import { ErrorApi } from '@/api/client';
import { useSesion } from '@/context/auth-context';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const RADIO = 90;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

const PASOS = [
  'Analizando tu nivel de actividad y fitness...',
  'Calculando tu objetivo de peso...',
  'Eligiendo la rutina que mejor te queda...',
];

export default function Generando() {
  const colors = useTheme();
  const { respuestas } = useOnboarding();
  const { actualizarCliente } = useSesion();
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
        if (!respuestas.nivelFitness || !respuestas.restriccionFisica) {
          throw new Error('Faltan datos del formulario');
        }
        await completarOnboarding({
          nivelFitness: respuestas.nivelFitness,
          nivelActividad: respuestas.nivelActividad,
          alturaCm: Math.round(respuestas.alturaCm),
          pesoActualKg: respuestas.pesoActualKg,
          pesoObjetivoKg: respuestas.pesoObjetivoKg,
          restriccionFisica: respuestas.restriccionFisica,
          horaRecordatorio: respuestas.horaRecordatorio ?? undefined,
        });
        if (cancelado) return;
        yaTermino.current = true;
        setPorcentaje(100);
        actualizarCliente({ onboardingCompletado: true, alturaCm: respuestas.alturaCm });
        setTimeout(() => {
          if (!cancelado) router.replace('/(tabs)');
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
  }, [
    intentos,
    actualizarCliente,
    respuestas.nivelFitness,
    respuestas.nivelActividad,
    respuestas.alturaCm,
    respuestas.pesoActualKg,
    respuestas.pesoObjetivoKg,
    respuestas.restriccionFisica,
    respuestas.horaRecordatorio,
  ]);

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
          style={[styles.botonReintentar, { borderColor: colors.tint }]}>
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
            stroke={colors.tint}
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
