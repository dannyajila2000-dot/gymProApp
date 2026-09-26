import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Ejercicio } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

type Pestana = 'como' | 'instrucciones';

export function DetalleEjercicioModal({
  visible,
  onCerrar,
  ejercicio,
  mostrarVideo,
}: {
  visible: boolean;
  onCerrar: () => void;
  ejercicio: Ejercicio;
  mostrarVideo: boolean;
}) {
  const colors = useTheme();
  const [pestana, setPestana] = useState<Pestana>('como');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.encabezado}>
            <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={1}>
              {ejercicio.nombre}
            </Text>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.chip, { backgroundColor: colors.backgroundElement, alignSelf: 'flex-start' }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '700' }}>
              {ejercicio.grupoMuscular}
            </Text>
          </View>

          <View style={[styles.segmentos, { backgroundColor: colors.backgroundElement }]}>
            <Pressable
              onPress={() => setPestana('como')}
              style={[styles.segmento, pestana === 'como' && { backgroundColor: colors.tint }]}>
              <Text
                style={{
                  color: pestana === 'como' ? colors.tintForeground : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 13,
                }}>
                Cómo hacerlo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPestana('instrucciones')}
              disabled={!ejercicio.descripcion}
              style={[styles.segmento, pestana === 'instrucciones' && { backgroundColor: colors.tint }]}>
              <Text
                style={{
                  color: pestana === 'instrucciones' ? colors.tintForeground : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 13,
                  opacity: ejercicio.descripcion ? 1 : 0.4,
                }}>
                Instrucciones
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.cuerpo} showsVerticalScrollIndicator={false}>
            {pestana === 'como' ? (
              <View style={[styles.fotoContenedor, { backgroundColor: colors.backgroundElement }]}>
                {mostrarVideo && ejercicio.gifUrl ? (
                  <Image source={{ uri: ejercicio.gifUrl }} style={styles.foto} contentFit="cover" />
                ) : (
                  <MunecoEjercicio patron={ejercicio.patronMovimiento} color={colors.tint} size={150} />
                )}
              </View>
            ) : (
              <Text style={[styles.descripcion, { color: colors.textSecondary }]}>
                {ejercicio.descripcion ?? 'Sin instrucciones adicionales para este ejercicio.'}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  contenido: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '80%',
    gap: Spacing.two,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  titulo: { fontSize: 18, fontWeight: '800', flex: 1 },
  chip: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  segmentos: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4, marginTop: Spacing.one },
  segmento: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cuerpo: { paddingVertical: Spacing.three, alignItems: 'center' },
  fotoContenedor: {
    width: 190,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foto: { width: '100%', height: '100%' },
  descripcion: { fontSize: 14.5, lineHeight: 21, textAlign: 'center', paddingHorizontal: Spacing.one },
});
