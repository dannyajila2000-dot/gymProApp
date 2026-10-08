import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonOnboarding } from '@/components/onboarding/boton-onboarding';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { fechaLarga } from '@/lib/membresia';
import { Spacing } from '@/constants/theme';

/**
 * Pantalla de bloqueo: la membresía del socio venció (o aún no tiene una). Hasta que la renueve en el gimnasio, la
 * app no deja usar nada; "Ya renové" vuelve a consultar el estado.
 */
export default function MembresiaVencida() {
  const colors = useTheme();
  const { cliente, actualizarMembresia, cerrarSesion } = useSesion();
  const [consultando, setConsultando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const membresia = cliente?.membresia;
  const sinMembresia = membresia?.estado === 'sin_membresia';

  async function consultar() {
    setConsultando(true);
    setAviso(null);
    try {
      const nueva = await actualizarMembresia();
      // Si ya está vigente, el navegador raíz saca esta pantalla solo; si no, se avisa.
      if (nueva === 'vencido' || nueva === 'sin_membresia') {
        setAviso('Todavía no vemos tu renovación. Si ya pagaste, pídele a tu gimnasio que la registre y vuelve a intentarlo.');
      }
    } catch {
      setAviso('No pudimos consultar tu membresía. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setConsultando(false);
    }
  }

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={[styles.icono, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name="lock-closed" size={50} color={colors.tint} />
      </View>

      <Text style={[styles.titulo, { color: colors.text }]}>
        {sinMembresia ? 'Aún no tienes una membresía activa' : 'Tu membresía venció'}
      </Text>
      <Text style={[styles.texto, { color: colors.textSecondary }]}>
        {sinMembresia
          ? 'Consulta en tu gimnasio para activar tu plan y volver a entrenar.'
          : `${membresia?.plan ? `Tu plan ${membresia.plan} ` : 'Tu plan '}venció${
              membresia?.venceEn ? ` el ${fechaLarga(membresia.venceEn)}` : ''
            }. Renuévalo en tu gimnasio para seguir entrenando.`}
      </Text>

      {aviso && <Text style={[styles.aviso, { color: colors.textSecondary, backgroundColor: colors.backgroundElement }]}>{aviso}</Text>}

      <BotonOnboarding onPress={consultar} fondo={colors.tintFondo} deshabilitado={consultando} style={styles.boton}>
        {consultando ? (
          <ActivityIndicator color={colors.tintForeground} />
        ) : (
          <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>Ya renové, actualizar</Text>
        )}
      </BotonOnboarding>

      <Pressable onPress={cerrarSesion} hitSlop={10} style={styles.salir}>
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cerrar sesión</Text>
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
  icono: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  texto: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 330,
  },
  aviso: {
    textAlign: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    overflow: 'hidden',
    maxWidth: 330,
  },
  boton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: Spacing.two,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '800',
  },
  salir: {
    paddingVertical: Spacing.two,
  },
});
