import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function ConfirmarModal({
  visible,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  destructivo = false,
  onConfirmar,
  onCancelar,
}: {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destructivo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const colors = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={styles.fondo}>
        <View style={[styles.tarjeta, { backgroundColor: colors.background }]}>
          <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
          <Text style={[styles.mensaje, { color: colors.textSecondary }]}>{mensaje}</Text>
          <View style={styles.filaBotones}>
            <Pressable onPress={onCancelar} style={[styles.boton, { backgroundColor: colors.backgroundElement }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{textoCancelar}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmar}
              style={[styles.boton, { backgroundColor: destructivo ? colors.danger : colors.tint }]}>
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>{textoConfirmar}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  tarjeta: {
    borderRadius: 22,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 340,
    gap: Spacing.two,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  mensaje: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  boton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
