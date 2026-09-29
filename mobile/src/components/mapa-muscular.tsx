import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

const GRUPOS_CUERPO_COMPLETO = new Set(['Cuerpo completo', 'Cardio']);

/** Regiones del mapa que sí se pueden "prender" según el grupo muscular de los ejercicios. */
type RegionActivable = 'hombros' | 'pecho' | 'espalda' | 'core' | 'piernas';

const GRUPO_POR_REGION: Record<RegionActivable, string> = {
  hombros: 'Hombros',
  pecho: 'Pecho',
  espalda: 'Espalda',
  core: 'Core',
  piernas: 'Piernas',
};

/** Silueta humana simplificada (vista de frente) que resalta las regiones trabajadas por la rutina. */
export function MapaMuscular({
  grupos,
  colorActivo,
  colorInactivo,
  colorDecorativo,
  colorContorno,
  size = 140,
}: {
  grupos: string[];
  colorActivo: string;
  colorInactivo: string;
  colorDecorativo: string;
  colorContorno: string;
  size?: number;
}) {
  const gruposSet = new Set(grupos);
  const todoActivo = grupos.some((g) => GRUPOS_CUERPO_COMPLETO.has(g));

  function colorDe(region: RegionActivable) {
    if (todoActivo || gruposSet.has(GRUPO_POR_REGION[region])) return colorActivo;
    return colorInactivo;
  }

  return (
    <Svg viewBox="0 0 120 250" width={size} height={(size * 250) / 120}>
      {/* Piernas (van detrás para que las caderas/brazos queden por encima visualmente) */}
      <Rect x={38} y={130} width={18} height={50} rx={9} fill={colorDe('piernas')} stroke={colorContorno} strokeWidth={1} />
      <Rect x={64} y={130} width={18} height={50} rx={9} fill={colorDe('piernas')} stroke={colorContorno} strokeWidth={1} />
      <Rect x={40} y={182} width={14} height={46} rx={7} fill={colorDe('piernas')} stroke={colorContorno} strokeWidth={1} />
      <Rect x={66} y={182} width={14} height={46} rx={7} fill={colorDe('piernas')} stroke={colorContorno} strokeWidth={1} />
      <Ellipse cx={47} cy={234} rx={10} ry={6} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />
      <Ellipse cx={73} cy={234} rx={10} ry={6} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />

      {/* Cadera (decorativa, solo une torso con piernas) */}
      <Rect x={36} y={114} width={48} height={16} rx={8} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />

      {/* Brazos (decorativos, sin categoría propia en el catálogo) */}
      <Rect x={10} y={50} width={12} height={68} rx={6} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />
      <Rect x={98} y={50} width={12} height={68} rx={6} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />

      {/* Espalda (lats, a los costados del pecho) */}
      <Rect x={24} y={50} width={12} height={34} rx={6} fill={colorDe('espalda')} stroke={colorContorno} strokeWidth={1} />
      <Rect x={84} y={50} width={12} height={34} rx={6} fill={colorDe('espalda')} stroke={colorContorno} strokeWidth={1} />

      {/* Core / abdomen */}
      <Rect x={40} y={76} width={40} height={40} rx={12} fill={colorDe('core')} stroke={colorContorno} strokeWidth={1} />

      {/* Pecho */}
      <Rect x={38} y={44} width={44} height={32} rx={14} fill={colorDe('pecho')} stroke={colorContorno} strokeWidth={1} />

      {/* Hombros */}
      <Circle cx={30} cy={50} r={13} fill={colorDe('hombros')} stroke={colorContorno} strokeWidth={1} />
      <Circle cx={90} cy={50} r={13} fill={colorDe('hombros')} stroke={colorContorno} strokeWidth={1} />

      {/* Cuello y cabeza (decorativos) */}
      <Rect x={52} y={34} width={16} height={10} rx={3} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />
      <Circle cx={60} cy={20} r={15} fill={colorDecorativo} stroke={colorContorno} strokeWidth={1} />
    </Svg>
  );
}
