import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { generarMarcas } from '@/lib/regla';

const PX_POR_PASO = 14;
const ALTO_REGLA = 70;

interface Props {
  valor: number;
  minimo: number;
  maximo: number;
  paso: number;
  pasoMayor: number;
  onCambiar: (valor: number) => void;
  colorIndicador?: string;
}

export function ReglaHorizontal({ valor, minimo, maximo, paso, pasoMayor, onCambiar, colorIndicador }: Props) {
  const colors = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [anchoContenedor, setAnchoContenedor] = useState(0);
  const yaCentrado = useRef(false);

  const marcas = generarMarcas(minimo, maximo, paso, pasoMayor);

  function onLayout(e: LayoutChangeEvent) {
    setAnchoContenedor(e.nativeEvent.layout.width);
  }

  useEffect(() => {
    if (anchoContenedor > 0 && !yaCentrado.current) {
      yaCentrado.current = true;
      const x = ((valor - minimo) / paso) * PX_POR_PASO;
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ x, animated: false }));
    }
    // Solo centramos una vez al montar; el resto del arrastre lo maneja el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchoContenedor]);

  function manejarScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (anchoContenedor === 0) return;
    const x = e.nativeEvent.contentOffset.x;
    const crudo = minimo + (x / PX_POR_PASO) * paso;
    const redondeado = Math.round(crudo / paso) * paso;
    const limitado = Math.min(maximo, Math.max(minimo, redondeado));
    if (Math.abs(limitado - valor) >= paso / 2) onCambiar(limitado);
  }

  const relleno = anchoContenedor / 2;

  return (
    <View style={styles.contenedor} onLayout={onLayout}>
      {anchoContenedor > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={PX_POR_PASO}
          onScroll={manejarScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: relleno }}>
          {marcas.map((marca) => (
            <View key={marca.valor} style={{ width: PX_POR_PASO, alignItems: 'center' }}>
              <View
                style={[
                  styles.marca,
                  {
                    height: marca.esMayor ? 28 : 14,
                    backgroundColor: colors.border,
                  },
                ]}
              />
              {marca.esMayor && (
                <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{Math.round(marca.valor)}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      <View pointerEvents="none" style={styles.indicadorWrap}>
        <View style={[styles.indicador, { backgroundColor: colorIndicador ?? colors.tint }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    height: ALTO_REGLA,
    justifyContent: 'flex-start',
  },
  marca: {
    width: 2,
    borderRadius: 1,
  },
  etiqueta: {
    fontSize: 11,
    marginTop: 2,
  },
  indicadorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
  },
  indicador: {
    width: 3,
    height: 34,
    borderRadius: 2,
  },
});
