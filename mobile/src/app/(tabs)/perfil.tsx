import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function Perfil() {
  const colors = useTheme();
  const { cliente, cerrarSesion } = useSesion();

  async function salir() {
    await cerrarSesion();
    router.replace('/(auth)/login');
  }

  const iniciales = `${cliente?.nombres?.[0] ?? ''}${cliente?.apellidos?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
        <Text style={[styles.avatarTexto, { color: colors.tintForeground }]}>{iniciales}</Text>
      </View>

      <Text style={[styles.nombre, { color: colors.text }]}>
        {cliente?.nombres} {cliente?.apellidos}
      </Text>
      <Text style={{ color: colors.textSecondary }}>{cliente?.email}</Text>

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Fila etiqueta="Gimnasio" valor={cliente?.gimnasio ?? '—'} />
      </View>

      <Pressable
        onPress={salir}
        style={[styles.botonSalir, { borderColor: colors.danger }]}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[styles.botonSalirTexto, { color: colors.danger }]}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const colors = useTheme();
  return (
    <View style={styles.fila}>
      <Text style={{ color: colors.textSecondary }}>{etiqueta}</Text>
      <Text style={{ color: colors.text, fontWeight: '600' }}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.one,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  avatarTexto: {
    fontSize: 28,
    fontWeight: '800',
  },
  nombre: {
    fontSize: 20,
    fontWeight: '800',
  },
  tarjeta: {
    width: '100%',
    borderRadius: 16,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.five,
  },
  botonSalirTexto: {
    fontSize: 15,
    fontWeight: '700',
  },
});
