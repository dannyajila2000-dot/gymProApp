import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const DURACION_VISIBLE_MS = 1400;

export function OverlayCompletado({
  visible,
  titulo = '¡Ejercicio completado!',
  subtitulo = 'Vamos al siguiente…',
  onTerminar,
}: {
  visible: boolean;
  titulo?: string;
  subtitulo?: string;
  onTerminar: () => void;
}) {
  const colors = useTheme();
  const progreso = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTerminarRef = useRef(onTerminar);

  useEffect(() => {
    onTerminarRef.current = onTerminar;
  }, [onTerminar]);

  useEffect(() => {
    if (visible) {
      progreso.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.back(1.4)) });
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        onTerminarRef.current();
      }, DURACION_VISIBLE_MS);
    } else {
      progreso.value = 0;
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, progreso]);

  const estiloAnimado = useAnimatedStyle(() => ({
    opacity: progreso.value,
    transform: [{ scale: 0.85 + progreso.value * 0.15 }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.fondo}>
      <Animated.View style={[styles.tarjeta, { backgroundColor: colors.background }, estiloAnimado]}>
        <View style={[styles.circuloIcono, { backgroundColor: colors.tint }]}>
          <Ionicons name="checkmark" size={36} color="#ffffff" />
        </View>
        <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
        <Text style={{ color: colors.textSecondary }}>{subtitulo}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 50,
  },
  tarjeta: {
    borderRadius: 24,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    gap: Spacing.one,
    minWidth: 230,
  },
  circuloIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
  },
});
