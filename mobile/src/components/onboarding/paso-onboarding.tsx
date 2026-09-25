import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const TOTAL_PASOS = 7;

interface Props {
  paso: number;
  titulo: string;
  onSiguiente: () => void;
  deshabilitado?: boolean;
  cargando?: boolean;
  textoBoton?: string;
  ocultarBoton?: boolean;
}

export function PasoOnboarding({
  paso,
  titulo,
  onSiguiente,
  deshabilitado,
  cargando,
  textoBoton = 'PRÓXIMO',
  ocultarBoton,
  children,
}: PropsWithChildren<Props>) {
  const colors = useTheme();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.barraProgreso}>
          {Array.from({ length: TOTAL_PASOS }).map((_, indice) => (
            <View
              key={indice}
              style={[
                styles.segmento,
                { backgroundColor: indice < paso ? colors.tint : colors.border },
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>

      <View style={styles.contenido}>{children}</View>

      {!ocultarBoton && (
        <Pressable
          onPress={onSiguiente}
          disabled={deshabilitado || cargando}
          style={[
            styles.boton,
            { backgroundColor: colors.text, opacity: deshabilitado || cargando ? 0.4 : 1 },
          ]}>
          {cargando ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.botonTexto, { color: colors.background }]}>{textoBoton}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: Spacing.six,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  barraProgreso: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  contenido: {
    flex: 1,
  },
  boton: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
