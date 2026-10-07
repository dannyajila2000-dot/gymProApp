import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

const PIEL = '#E8B98A';
const PIEL_SOMBRA = '#D7A073';
const NEGRO = '#111111';

/**
 * Entrenador amistoso dibujado en vectores con la paleta de la app (dorado y negro). Una mano levanta
 * el pulgar y la otra sostiene una mancuerna. Mantiene la proporción 200 x 260.
 */
export function EntrenadorIlustracion({ ancho = 220 }: { ancho?: number }) {
  const colors = useTheme();
  const dorado = colors.tintFondo;
  const doradoOscuro = colors.tint;
  const alto = (ancho * 260) / 200;

  return (
    <Svg width={ancho} height={alto} viewBox="0 0 200 260" accessibilityLabel="Entrenador sonriendo">
      {/* Fondo y sombra */}
      <Circle cx={100} cy={132} r={94} fill={colors.backgroundSelected} />
      <Ellipse cx={100} cy={248} rx={52} ry={7} fill={NEGRO} opacity={0.1} />

      {/* Piernas, pantorrillas y zapatillas */}
      <Rect x={71} y={146} width={28} height={46} rx={9} fill={NEGRO} />
      <Rect x={101} y={146} width={28} height={46} rx={9} fill={NEGRO} />
      <Rect x={76} y={188} width={18} height={44} rx={8} fill={PIEL} />
      <Rect x={106} y={188} width={18} height={44} rx={8} fill={PIEL} />
      <Ellipse cx={84} cy={239} rx={19} ry={8} fill="#F5F1E6" stroke={NEGRO} strokeWidth={2} />
      <Ellipse cx={116} cy={239} rx={19} ry={8} fill="#F5F1E6" stroke={NEGRO} strokeWidth={2} />
      <Path d="M68 239 H100" stroke={dorado} strokeWidth={3} strokeLinecap="round" />
      <Path d="M100 239 H132" stroke={dorado} strokeWidth={3} strokeLinecap="round" />

      {/* Brazo izquierdo: sostiene una mancuerna colgando a un lado */}
      <Path d="M68 98 L50 122 L50 152" stroke={PIEL} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={47} y={140} width={6} height={34} rx={3} fill={NEGRO} />
      <Rect x={38} y={134} width={24} height={10} rx={4} fill={dorado} />
      <Rect x={38} y={170} width={24} height={10} rx={4} fill={dorado} />
      <Circle cx={50} cy={156} r={8.5} fill={PIEL} />

      {/* Brazo derecho: pulgar arriba */}
      <Path d="M132 98 L156 114 L164 92" stroke={PIEL} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={165} cy={86} r={10} fill={PIEL} />
      <Rect x={162} y={66} width={7} height={18} rx={3.5} fill={PIEL} />

      {/* Torso y mangas */}
      <Path
        d="M64 94 Q64 84 78 82 L122 82 Q136 84 136 94 L132 158 Q100 166 68 158 Z"
        fill={dorado}
      />
      <Path d="M68 150 Q100 160 132 150 L132 158 Q100 166 68 158 Z" fill={doradoOscuro} opacity={0.35} />
      <Circle cx={69} cy={98} r={13} fill={dorado} />
      <Circle cx={131} cy={98} r={13} fill={dorado} />
      <Path d="M88 82 Q100 96 112 82 Z" fill={doradoOscuro} opacity={0.5} />
      <Circle cx={100} cy={126} r={10} fill={NEGRO} />
      <Path d="M94 126 H106 M100 120 V132" stroke={dorado} strokeWidth={2.4} strokeLinecap="round" />

      {/* Cordón y silbato */}
      <Path d="M92 84 L100 114 L108 84" stroke={NEGRO} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Circle cx={100} cy={116} r={4.5} fill={dorado} stroke={NEGRO} strokeWidth={1.5} />

      {/* Cuello, cabeza y orejas */}
      <Rect x={92} y={70} width={16} height={16} rx={6} fill={PIEL_SOMBRA} />
      <Circle cx={76} cy={54} r={5.5} fill={PIEL_SOMBRA} />
      <Circle cx={124} cy={54} r={5.5} fill={PIEL_SOMBRA} />
      <Circle cx={100} cy={52} r={25} fill={PIEL} />

      {/* Gorra */}
      <Path d="M75 48 Q77 24 100 22 Q123 24 125 48 Z" fill={NEGRO} />
      <Path d="M70 47 Q100 40 130 47 Q135 53 128 55 L72 55 Q65 53 70 47 Z" fill={dorado} />
      <Circle cx={100} cy={34} r={5} fill={dorado} />

      {/* Cara */}
      <G>
        <Circle cx={90} cy={62} r={2.8} fill={NEGRO} />
        <Circle cx={110} cy={62} r={2.8} fill={NEGRO} />
        <Path d="M84 56 Q90 53 96 56 M104 56 Q110 53 116 56" stroke={NEGRO} strokeWidth={2} strokeLinecap="round" fill="none" />
        <Circle cx={83} cy={69} r={4.5} fill="#E89A7A" opacity={0.45} />
        <Circle cx={117} cy={69} r={4.5} fill="#E89A7A" opacity={0.45} />
        <Path d="M90 70 Q100 80 110 70" stroke={NEGRO} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </G>
    </Svg>
  );
}
