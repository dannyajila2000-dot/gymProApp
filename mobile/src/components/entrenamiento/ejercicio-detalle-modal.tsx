import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Ejercicio } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, Spacing } from '@/constants/theme';

export function EjercicioDetalleModal({ ejercicio, onCerrar }: { ejercicio: Ejercicio; onCerrar: () => void }) {
  const colors = useTheme();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.encabezado}>
            <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={2}>
              {ejercicio.nombre}
            </Text>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: Spacing.four }} showsVerticalScrollIndicator={false}>
            <View style={[styles.ilustracion, { backgroundColor: colors.backgroundElement }]}>
              <MunecoEjercicio patron={ejercicio.patronMovimiento} color={colors.tint} size={110} />
            </View>

            <View style={[styles.chipGrupo, { backgroundColor: colors.backgroundSelected }]}>
              <Ionicons name="body-outline" size={14} color={colors.tint} />
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12.5 }}>{ejercicio.grupoMuscular}</Text>
            </View>

            {ejercicio.descripcion && (
              <>
                <Text style={[styles.seccionTitulo, { color: colors.tint }]}>Instrucciones</Text>
                <Text style={{ color: colors.text, fontSize: 14.5, lineHeight: 21 }}>{ejercicio.descripcion}</Text>
              </>
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
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  titulo: { fontSize: 20, fontWeight: '800', flex: 1 },
  ilustracion: {
    borderRadius: 20,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    ...CardShadow,
  },
  chipGrupo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: Spacing.three,
  },
  seccionTitulo: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: Spacing.four, marginBottom: Spacing.one },
});
