import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { generarMarcas } from '@/lib/regla';

const PX_POR_PASO = 10;

interface Props {
  valor: number;
  minimo: number;
  maximo: number;
  paso: number;
  pasoMayor: number;
  onCambiar: (valor: number) => void;
  alto?: number;
}

export function ReglaVertical({ valor, minimo, maximo, paso, pasoMayor, onCambiar, alto = 320 }: Props) {
  const colors = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [altoMedido, setAltoMedido] = useState(0);
  const yaCentrado = useRef(false);

  const marcas = generarMarcas(minimo, maximo, paso, pasoMayor).reverse();

  function onLayout(e: LayoutChangeEvent) {
    setAltoMedido(e.nativeEvent.layout.height);
  }

  useEffect(() => {
    if (altoMedido > 0 && !yaCentrado.current) {
      yaCentrado.current = true;
      const y = ((maximo - valor) / paso) * PX_POR_PASO;
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [altoMedido]);

  function manejarScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (altoMedido === 0) return;
    const y = e.nativeEvent.contentOffset.y;
    const crudo = maximo - (y / PX_POR_PASO) * paso;
    const redondeado = Math.round(crudo / paso) * paso;
    const limitado = Math.min(maximo, Math.max(minimo, redondeado));
    if (Math.abs(limitado - valor) >= paso / 2) onCambiar(limitado);
  }

  const relleno = altoMedido / 2;

  return (
    <View style={[styles.contenedor, { height: alto }]} onLayout={onLayout}>
      {altoMedido > 0 && (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={PX_POR_PASO}
          onScroll={manejarScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: relleno }}>
          {marcas.map((marca) => (
            <View key={marca.valor} style={{ height: PX_POR_PASO, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.marca,
                  {
                    width: marca.esMayor ? 26 : 14,
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
        <View style={[styles.indicador, { backgroundColor: colors.tint }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: 70,
    justifyContent: 'center',
  },
  marca: {
    height: 2,
    borderRadius: 1,
  },
  etiqueta: {
    fontSize: 11,
    marginLeft: 4,
  },
  indicadorWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
  },
  indicador: {
    height: 3,
    width: 34,
    borderRadius: 2,
  },
});
