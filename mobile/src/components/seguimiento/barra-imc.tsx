import { StyleSheet, View } from 'react-native';

const COLORES_CATEGORIA = ['#5C93FF', '#1FA971', '#D9A62E', '#D9534F'];
const IMC_MIN = 14;
const IMC_MAX = 38;

export function BarraImc({ imc, colorIndicador }: { imc: number; colorIndicador: string }) {
  const posicionPct = Math.min(100, Math.max(0, ((imc - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100));

  const anchos = [
    ((18.5 - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100,
    ((25 - 18.5) / (IMC_MAX - IMC_MIN)) * 100,
    ((30 - 25) / (IMC_MAX - IMC_MIN)) * 100,
  ];
  const anchoUltimo = 100 - anchos.reduce((a, b) => a + b, 0);

  return (
    <View style={{ paddingTop: 8 }}>
      <View style={styles.barra}>
        {[...anchos, anchoUltimo].map((ancho, i) => (
          <View key={i} style={{ width: `${ancho}%`, backgroundColor: COLORES_CATEGORIA[i], height: '100%' }} />
        ))}
      </View>
      <View style={[styles.indicador, { left: `${posicionPct}%` }]}>
        <View style={[styles.triangulo, { borderTopColor: colorIndicador }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  indicador: {
    position: 'absolute',
    top: -6,
    marginLeft: -5,
    alignItems: 'center',
  },
  triangulo: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
