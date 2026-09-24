import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';

export type PatronMovimiento =
  | 'sentadilla'
  | 'press'
  | 'remo'
  | 'curl'
  | 'salto'
  | 'abdominal'
  | 'plancha'
  | 'pantorrilla';

const AG = Animated.createAnimatedComponent(G) as unknown as React.ComponentType<any>;
const ALine = Animated.createAnimatedComponent(Line) as unknown as React.ComponentType<any>;

function useProgreso(duracionMs: number) {
  const [progreso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(progreso, {
          toValue: 1,
          duration: duracionMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progreso, {
          toValue: 0,
          duration: duracionMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
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

  let grupoY: any = 0;
  let grupoRotacion: any = 0;
  let grupoOrigen = '50,50';
  let torsoRotacion: any = 0;
  let brazoIzqX2: any = 32;
  let brazoIzqY2: any = 55;
  let brazoDerX2: any = 68;
  let brazoDerY2: any = 55;
  let piernaIzqX2: any = 35;
  let piernaIzqY2: any = 85;
  let piernaDerX2: any = 65;
  let piernaDerY2: any = 85;

  switch (patron) {
    case 'sentadilla':
      grupoY = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
      piernaIzqX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [35, 28] });
      piernaDerX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [65, 72] });
      break;
    case 'press':
      brazoIzqY2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [55, 12] });
      brazoDerY2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [55, 12] });
      break;
    case 'remo':
      brazoIzqX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [22, 52] });
      brazoDerX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [78, 52] });
      break;
    case 'curl':
      brazoIzqX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [30, 46] });
      brazoIzqY2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [65, 38] });
      brazoDerX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [70, 54] });
      brazoDerY2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [65, 38] });
      break;
    case 'salto':
      grupoY = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
      brazoIzqX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [32, 22] });
      brazoIzqY2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [55, 14] });
      brazoDerX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [68, 78] });
      brazoDerY2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [55, 14] });
      piernaIzqX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [42, 22] });
      piernaDerX2 = progreso.interpolate({ inputRange: [0, 1], outputRange: [58, 78] });
      break;
    case 'abdominal':
      torsoRotacion = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, -28] });
      grupoOrigen = '50,60';
      break;
    case 'plancha':
      grupoRotacion = -90;
      grupoOrigen = '50,50';
      grupoY = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });
      break;
    case 'pantorrilla':
      grupoY = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
      break;
  }

  return (
    <View style={[styles.contenedor, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <AG y={grupoY} rotation={grupoRotacion} origin={grupoOrigen}>
          <AG rotation={torsoRotacion} origin="50,60">
            <Circle cx={50} cy={22} r={9} fill={color} />
            <Line x1={50} y1={31} x2={50} y2={60} stroke={color} strokeWidth={5} strokeLinecap="round" />
            <ALine x1={50} y1={38} x2={brazoIzqX2} y2={brazoIzqY2} stroke={color} strokeWidth={4.5} strokeLinecap="round" />
            <ALine x1={50} y1={38} x2={brazoDerX2} y2={brazoDerY2} stroke={color} strokeWidth={4.5} strokeLinecap="round" />
          </AG>
          <ALine x1={50} y1={60} x2={piernaIzqX2} y2={piernaIzqY2} stroke={color} strokeWidth={5} strokeLinecap="round" />
          <ALine x1={50} y1={60} x2={piernaDerX2} y2={piernaDerY2} stroke={color} strokeWidth={5} strokeLinecap="round" />
        </AG>
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
