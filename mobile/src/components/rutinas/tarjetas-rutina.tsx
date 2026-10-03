import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import type { Rutina } from '@/api/rutinas';
import { Spacing } from '@/constants/theme';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { caloriasEstimadas, duracionEstimadaMin } from '@/lib/rutina-utils';

export function subtituloRutina(rutina: Rutina, pesoKg?: number | null) {
  return `${duracionEstimadaMin(rutina)} min · ${caloriasEstimadas(rutina, pesoKg)} kcal`;
}

function imagenDeRutina(rutina: Rutina) {
  return rutina.imagenUrl ?? rutina.ejercicios[0]?.ejercicio.gifUrl ?? null;
}

export function RutinaImagen({ rutina, style }: { rutina: Rutina; style?: StyleProp<ImageStyle> }) {
  const colors = useTheme();
  const uri = imagenDeRutina(rutina);

  return uri ? (
    <Image source={{ uri }} style={[styles.imagen, { backgroundColor: colors.backgroundSelected }, style]} contentFit="cover" />
  ) : (
    <View style={[styles.imagen, styles.imagenVacia, { backgroundColor: colors.backgroundSelected }, style]}>
      <Ionicons name="barbell-outline" size={28} color={colors.tint} />
    </View>
  );
}

/** Tarjeta grande de carrusel: foto redondeada con nombre y "min · kcal" debajo. */
export function RutinaTarjetaCarrusel({ rutina, ancho, onPress }: { rutina: Rutina; ancho: number; onPress: () => void }) {
  const { cliente } = useSesion();
  const colors = useTheme();

  return (
    <Pressable onPress={onPress} style={{ width: ancho }}>
      <RutinaImagen rutina={rutina} style={{ width: ancho, height: ancho * 0.58, borderRadius: 18 }} />
      <Text style={[styles.tarjetaTitulo, { color: colors.text }]} numberOfLines={2}>
        {rutina.nombre}
      </Text>
      <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>{subtituloRutina(rutina, cliente?.pesoActualKg)}</Text>
    </Pressable>
  );
}

/** Fila con miniatura cuadrada, título y "min · kcal". */
export function RutinaFila({
  rutina,
  onPress,
  conSeparador = true,
}: {
  rutina: Rutina;
  onPress: () => void;
  conSeparador?: boolean;
}) {
  const { cliente } = useSesion();
  const colors = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.fila}>
      <RutinaImagen rutina={rutina} style={styles.miniatura} />
      <View style={[styles.filaTexto, conSeparador && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
        <Text style={[styles.filaTitulo, { color: colors.text }]} numberOfLines={2}>
          {rutina.nombre}
        </Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>{subtituloRutina(rutina, cliente?.pesoActualKg)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imagen: { borderRadius: 16 },
  imagenVacia: { alignItems: 'center', justifyContent: 'center' },
  tarjetaTitulo: { fontSize: 15.5, fontWeight: '700', marginTop: Spacing.two },
  subtitulo: { fontSize: 13.5, fontWeight: '600', marginTop: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  miniatura: { width: 84, height: 84, borderRadius: 16 },
  filaTexto: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', paddingVertical: Spacing.one },
  filaTitulo: { fontSize: 16, fontWeight: '800' },
});
