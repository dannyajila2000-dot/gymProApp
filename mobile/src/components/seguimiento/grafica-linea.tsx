import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export interface PuntoLinea {
  fecha: string;
  valor: number;
}

function construirPath(puntos: { x: number; y: number }[]) {
  return puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function GraficaLinea({
  puntos,
  metaValor,
  color,
  colorMeta,
  colorTexto,
  colorFondoTooltip,
  unidad,
  alto = 140,
}: {
  puntos: PuntoLinea[];
  metaValor?: number;
  color: string;
  colorMeta: string;
  colorTexto: string;
  colorFondoTooltip: string;
  unidad: string;
  alto?: number;
}) {
  const [ancho, setAncho] = useState(0);
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);

  function alMedir(e: LayoutChangeEvent) {
    setAncho(e.nativeEvent.layout.width);
  }

  if (puntos.length === 0) {
    return (
      <View style={[styles.vacio, { height: alto }]}>
        <Text style={{ color: colorTexto }}>Sin registros aún</Text>
      </View>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const minimo = Math.min(...valores, metaValor ?? Infinity);
  const maximo = Math.max(...valores, metaValor ?? -Infinity);
  const rango = Math.max(1, maximo - minimo);
  const paddingV = 16;

  const coords = puntos.map((p, i) => ({
    x: puntos.length > 1 ? (i / (puntos.length - 1)) * ancho : ancho / 2,
    y: paddingV + (1 - (p.valor - minimo) / rango) * (alto - paddingV * 2),
  }));

  const yMeta =
    metaValor !== undefined ? paddingV + (1 - (metaValor - minimo) / rango) * (alto - paddingV * 2) : null;

  const puntoActivo = indiceActivo !== null ? puntos[indiceActivo] : null;
  const coordActivo = indiceActivo !== null ? coords[indiceActivo] : null;

  return (
    <View onLayout={alMedir}>
      {ancho > 0 && (
        <View>
          <Svg width={ancho} height={alto}>
            {yMeta !== null && (
              <Line x1={0} y1={yMeta} x2={ancho} y2={yMeta} stroke={colorMeta} strokeWidth={1.5} strokeDasharray="4 4" />
            )}
            <Path d={construirPath(coords)} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            {coords.map((c, i) => (
              <Circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={i === indiceActivo ? 6 : 4}
                fill={colorFondoTooltip}
                stroke={color}
                strokeWidth={2.5}
              />
            ))}
          </Svg>
          {coords.map((c, i) => (
            <Pressable
              key={i}
              onPress={() => setIndiceActivo(i === indiceActivo ? null : i)}
              hitSlop={10}
              style={{ position: 'absolute', left: c.x - 14, top: c.y - 14, width: 28, height: 28 }}
            />
          ))}
          {puntoActivo && coordActivo && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  backgroundColor: colorFondoTooltip,
                  left: Math.min(Math.max(coordActivo.x - 44, 0), ancho - 88),
                  top: Math.max(coordActivo.y - 54, 0),
                },
              ]}>
              <Text style={styles.tooltipFecha}>
                {new Date(puntoActivo.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </Text>
              <Text style={styles.tooltipValor}>
                {puntoActivo.valor} {unidad}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 88,
    alignItems: 'center',
  },
  tooltipFecha: {
    color: '#D9D9DF',
    fontSize: 10,
  },
  tooltipValor: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
