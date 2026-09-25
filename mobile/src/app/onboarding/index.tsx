import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function BienvenidaOnboarding() {
  const colors = useTheme();
  const { cliente } = useSesion();

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="barbell" size={48} color={colors.tint} />
      </View>

      <Text style={[styles.titulo, { color: colors.text }]}>
        Hola{cliente?.nombres ? `, ${cliente.nombres}` : ''}:{'\n'}Bienvenido al viaje del cuerpo de
        tus sueños
      </Text>

      <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
        Aquí vienen unas sencillas preguntas para que podamos{' '}
        <Text style={{ color: colors.tint, fontWeight: '700' }}>personalizar</Text> tu{' '}
        <Text style={{ color: colors.tint, fontWeight: '700' }}>objetivo y rutina</Text> diarios.
      </Text>

      <Pressable
        onPress={() => router.push('/onboarding/nivel-fitness')}
        style={[styles.boton, { backgroundColor: colors.tint }]}>
        <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>Comienzo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.three,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  boton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '800',
  },
});
