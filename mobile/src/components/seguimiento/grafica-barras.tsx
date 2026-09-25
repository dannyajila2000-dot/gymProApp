import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function GraficaBarras({
  valores,
  diaActual,
  color,
  colorFondo,
  colorTexto,
  alto = 90,
}: {
  valores: number[];
  diaActual: number;
  color: string;
  colorFondo: string;
  colorTexto: string;
  alto?: number;
}) {
  const maximo = Math.max(1, ...valores);
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  const anchoBarra = 22;
  const gap = 14;
  const ancho = valores.length * anchoBarra + (valores.length - 1) * gap;
  const yPromedio = alto - (promedio / maximo) * (alto - 10);

  return (
    <View>
      <Svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`}>
        {promedio > 0 && (
          <Line
            x1={0}
            y1={yPromedio}
            x2={ancho}
            y2={yPromedio}
            stroke={colorTexto}
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.4}
          />
        )}
        {valores.map((valor, i) => {
          const x = i * (anchoBarra + gap);
          const tieneValor = valor > 0;
          const alturaBarra = tieneValor ? Math.max(6, (valor / maximo) * (alto - 10)) : 4;
          const y = alto - alturaBarra;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={anchoBarra}
              height={alturaBarra}
              rx={anchoBarra / 2}
              fill={tieneValor ? color : colorFondo}
            />
          );
        })}
      </Svg>
      <View style={[styles.filaEtiquetas, { width: ancho }]}>
        {DIAS.map((dia, i) => (
          <View key={i} style={{ width: anchoBarra, alignItems: 'center' }}>
            <Text style={{ color: i === diaActual ? color : colorTexto, fontWeight: i === diaActual ? '800' : '600', fontSize: 12 }}>
              {dia}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filaEtiquetas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
