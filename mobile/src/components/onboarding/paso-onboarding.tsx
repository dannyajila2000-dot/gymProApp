import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonOnboarding } from '@/components/onboarding/boton-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const TOTAL_PASOS = 12;

interface Props {
  paso: number;
  titulo: string;
  onSiguiente: () => void;
  deshabilitado?: boolean;
  cargando?: boolean;
  textoBoton?: string;
  ocultarBoton?: boolean;
  /** Para pantallas con más contenido que alto: el contenido se desplaza y el botón queda fijo abajo. */
  desplazable?: boolean;
}

export function PasoOnboarding({
  paso,
  titulo,
  onSiguiente,
  deshabilitado,
  cargando,
  textoBoton = 'PRÓXIMO',
  ocultarBoton,
  desplazable,
  children,
}: PropsWithChildren<Props>) {
  const colors = useTheme();
  // Desde el resumen se puede editar una respuesta: se abre la pantalla con ?editar=1 y al guardar vuelve al resumen.
  const { editar } = useLocalSearchParams<{ editar?: string }>();
  const editando = editar === '1';
  // En Android la app se dibuja bajo la barra de navegación del sistema: sin este margen, la parte baja del
  // botón queda debajo de ella y el primer toque se pierde.
  const insets = useSafeAreaInsets();

  // Al pulsar, el botón responde al instante (se atenúa y muestra un spinner) y ignora toques repetidos
  // mientras cambia de pantalla; así no se apilan pantallas duplicadas si se pulsa dos veces.
  const bloqueado = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  function pulsar() {
    if (bloqueado.current) return;
    bloqueado.current = true;
    setOcupado(true);
    if (editando) router.back();
    else onSiguiente();
    temporizador.current = setTimeout(() => {
      bloqueado.current = false;
      setOcupado(false);
    }, 900);
  }

  return (
    <View
      style={[
        styles.contenedor,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(Spacing.six, insets.top + Spacing.three),
          paddingBottom: Spacing.three + insets.bottom,
        },
      ]}>
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
                { backgroundColor: indice < paso ? colors.tintFondo : colors.border },
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>

      {desplazable ? (
        <ScrollView style={styles.contenido} contentContainerStyle={{ paddingBottom: Spacing.three }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.contenido}>{children}</View>
      )}

      {!ocultarBoton && (
        <BotonOnboarding
          onPress={pulsar}
          fondo={colors.text}
          deshabilitado={deshabilitado || cargando}
          atenuado={ocupado}
          style={styles.boton}>
          {cargando || ocupado ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.botonTexto, { color: colors.background }]}>{editando ? 'GUARDAR' : textoBoton}</Text>
          )}
        </BotonOnboarding>
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
