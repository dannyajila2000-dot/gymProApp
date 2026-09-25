import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const OPCIONES = [
  {
    ruta: '/ajustes/perfil' as const,
    icono: 'person-outline' as const,
    titulo: 'Mi perfil',
    descripcion: 'Datos personales, unidades y contraseña',
  },
  {
    ruta: '/ajustes/entrenamiento' as const,
    icono: 'barbell-outline' as const,
    titulo: 'Ajustes de entrenamiento',
    descripcion: 'Restricción física y entrenador',
  },
  {
    ruta: '/ajustes/recordatorios' as const,
    icono: 'notifications-outline' as const,
    titulo: 'Recordatorios',
    descripcion: 'Avisos para hacer ejercicio',
  },
];

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

      <View style={styles.menu}>
        {OPCIONES.map((op) => (
          <Pressable
            key={op.ruta}
            onPress={() => router.push(op.ruta)}
            style={[styles.filaMenu, { borderColor: colors.border }]}>
            <Ionicons name={op.icono} size={22} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{op.titulo}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{op.descripcion}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={salir} style={[styles.botonSalir, { borderColor: colors.danger }]}>
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
  menu: {
    width: '100%',
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  filaMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
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
