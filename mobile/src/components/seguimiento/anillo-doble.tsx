import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const ACircle = Animated.createAnimatedComponent(Circle) as unknown as React.ComponentType<any>;

function Anillo({
  radio,
  centro,
  grosor,
  colorFondo,
  colorActivo,
  progreso,
}: {
  radio: number;
  centro: number;
  grosor: number;
  colorFondo: string;
  colorActivo: string;
  progreso: number;
}) {
  const [animado] = useState(() => new Animated.Value(0));
  const circunferencia = 2 * Math.PI * radio;

  useEffect(() => {
    Animated.timing(animado, {
      toValue: Math.min(1, Math.max(0, progreso)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progreso, animado]);

  const dashoffset = animado.interpolate({
    inputRange: [0, 1],
    outputRange: [circunferencia, 0],
  });

  return (
    <>
      <Circle cx={centro} cy={centro} r={radio} stroke={colorFondo} strokeWidth={grosor} fill="none" />
      <ACircle
        cx={centro}
        cy={centro}
        r={radio}
        stroke={colorActivo}
        strokeWidth={grosor}
        fill="none"
        strokeDasharray={`${circunferencia} ${circunferencia}`}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${centro}, ${centro}`}
      />
    </>
  );
}

export function AnilloDoble({
  size = 140,
  progresoExterior,
  progresoInterior,
  colorExterior,
  colorInterior,
  colorFondo,
}: {
  size?: number;
  progresoExterior: number;
  progresoInterior: number;
  colorExterior: string;
  colorInterior: string;
  colorFondo: string;
}) {
  const centro = size / 2;
  const grosor = size * 0.09;
  const radioExterior = centro - grosor / 2 - 2;
  const radioInterior = radioExterior - grosor - 6;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Anillo
          radio={radioExterior}
          centro={centro}
          grosor={grosor}
          colorFondo={colorFondo}
          colorActivo={colorExterior}
          progreso={progresoExterior}
        />
        <Anillo
          radio={radioInterior}
          centro={centro}
          grosor={grosor}
          colorFondo={colorFondo}
          colorActivo={colorInterior}
          progreso={progresoInterior}
        />
      </Svg>
    </View>
  );
}

export function AnilloSimple({
  size = 100,
  progreso,
  color,
  colorFondo,
  children,
}: {
  size?: number;
  progreso: number;
  color: string;
  colorFondo: string;
  children?: React.ReactNode;
}) {
  const centro = size / 2;
  const grosor = size * 0.11;
  const radio = centro - grosor / 2 - 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Anillo
          radio={radio}
          centro={centro}
          grosor={grosor}
          colorFondo={colorFondo}
          colorActivo={color}
          progreso={progreso}
        />
      </Svg>
      {children}
    </View>
  );
}
