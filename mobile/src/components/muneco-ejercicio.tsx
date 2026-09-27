import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type PatronMovimiento =
  | 'sentadilla'
  | 'press'
  | 'remo'
  | 'curl'
  | 'salto'
  | 'abdominal'
  | 'plancha'
  | 'pantorrilla';

// Animado con Reanimated (no con la Animated de React Native): las props de
// SVG no soportan useNativeDriver, así que con la Animated de RN la
// animación corría en el hilo de JS y competía por procesador con el
// cronómetro del entrenamiento, causando que se viera "trabado". Reanimated
// corre esto en su propio hilo, sin pelear por el mismo procesador.
const AnimatedG = createAnimatedComponent(G);
const AnimatedLine = createAnimatedComponent(Line);

function useProgreso(duracionMs: number) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withRepeat(
      withTiming(1, { duration: duracionMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(progreso);
  }, [progreso, duracionMs]);

  return progreso;
}

const DURACION_POR_PATRON: Record<PatronMovimiento, number> = {
  sentadilla: 700,
  press: 650,
  remo: 600,
  curl: 550,
  salto: 400,
  abdominal: 650,
  plancha: 180,
  pantorrilla: 500,
};

export function MunecoEjercicio({
  patron,
  color,
  size = 140,
}: {
  patron: PatronMovimiento;
  color: string;
  size?: number;
}) {
  const progreso = useProgreso(DURACION_POR_PATRON[patron]);

  const grupoRotacion = patron === 'plancha' ? -90 : 0;
  const grupoOrigen = patron === 'abdominal' ? '50,60' : '50,50';

  const grupoProps = useAnimatedProps(() => {
    let y = 0;
    if (patron === 'sentadilla') y = interpolate(progreso.value, [0, 1], [0, 12]);
    else if (patron === 'salto') y = interpolate(progreso.value, [0, 1], [0, -8]);
    else if (patron === 'plancha') y = interpolate(progreso.value, [0, 1], [0, 2]);
    else if (patron === 'pantorrilla') y = interpolate(progreso.value, [0, 1], [0, -4]);
    return { y };
  });

  const torsoProps = useAnimatedProps(() => {
    const rotation = patron === 'abdominal' ? interpolate(progreso.value, [0, 1], [0, -28]) : 0;
    return { rotation };
  });

  const brazoIzqProps = useAnimatedProps(() => {
    let x2 = 32;
    let y2 = 55;
    if (patron === 'press') {
      y2 = interpolate(progreso.value, [0, 1], [55, 12]);
    } else if (patron === 'remo') {
      x2 = interpolate(progreso.value, [0, 1], [22, 52]);
    } else if (patron === 'curl') {
      x2 = interpolate(progreso.value, [0, 1], [30, 46]);
      y2 = interpolate(progreso.value, [0, 1], [65, 38]);
    } else if (patron === 'salto') {
      x2 = interpolate(progreso.value, [0, 1], [32, 22]);
      y2 = interpolate(progreso.value, [0, 1], [55, 14]);
    }
    return { x2, y2 };
  });

  const brazoDerProps = useAnimatedProps(() => {
    let x2 = 68;
    let y2 = 55;
    if (patron === 'press') {
      y2 = interpolate(progreso.value, [0, 1], [55, 12]);
    } else if (patron === 'remo') {
      x2 = interpolate(progreso.value, [0, 1], [78, 52]);
    } else if (patron === 'curl') {
      x2 = interpolate(progreso.value, [0, 1], [70, 54]);
      y2 = interpolate(progreso.value, [0, 1], [65, 38]);
    } else if (patron === 'salto') {
      x2 = interpolate(progreso.value, [0, 1], [68, 78]);
      y2 = interpolate(progreso.value, [0, 1], [55, 14]);
    }
    return { x2, y2 };
  });

  const piernaIzqProps = useAnimatedProps(() => {
    let x2 = 35;
    if (patron === 'sentadilla') x2 = interpolate(progreso.value, [0, 1], [35, 28]);
    else if (patron === 'salto') x2 = interpolate(progreso.value, [0, 1], [42, 22]);
    return { x2, y2: 85 };
  });

  const piernaDerProps = useAnimatedProps(() => {
    let x2 = 65;
    if (patron === 'sentadilla') x2 = interpolate(progreso.value, [0, 1], [65, 72]);
    else if (patron === 'salto') x2 = interpolate(progreso.value, [0, 1], [58, 78]);
    return { x2, y2: 85 };
  });

  return (
    <View style={[styles.contenedor, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <AnimatedG rotation={grupoRotacion} origin={grupoOrigen} animatedProps={grupoProps}>
          <AnimatedG origin="50,60" animatedProps={torsoProps}>
            <Circle cx={50} cy={22} r={9} fill={color} />
            <Line x1={50} y1={31} x2={50} y2={60} stroke={color} strokeWidth={5} strokeLinecap="round" />
            <AnimatedLine x1={50} y1={38} animatedProps={brazoIzqProps} stroke={color} strokeWidth={4.5} strokeLinecap="round" />
            <AnimatedLine x1={50} y1={38} animatedProps={brazoDerProps} stroke={color} strokeWidth={4.5} strokeLinecap="round" />
          </AnimatedG>
          <AnimatedLine x1={50} y1={60} animatedProps={piernaIzqProps} stroke={color} strokeWidth={5} strokeLinecap="round" />
          <AnimatedLine x1={50} y1={60} animatedProps={piernaDerProps} stroke={color} strokeWidth={5} strokeLinecap="round" />
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
