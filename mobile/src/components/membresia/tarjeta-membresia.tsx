import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, Spacing } from '@/constants/theme';
import { diasHastaVencimiento, fechaLarga } from '@/lib/membresia';

/**
 * Los días que le quedan de membresía al socio (solo lectura). Solo la ven los socios que el gimnasio dio de alta en
 * AdminPro; el resto de cuentas no tiene membresía y la tarjeta no aparece. Con 7 días o menos cambia a un tono de aviso.
 */
export function TarjetaMembresia() {
  const { cliente } = useSesion();
  const membresia = cliente?.membresia;
  if (!membresia?.venceEn) return null;
  return <TarjetaMembresiaVista plan={membresia.plan} venceEn={membresia.venceEn} />;
}

/** La tarjeta en sí, sin leer la sesión. */
export function TarjetaMembresiaVista({ plan: nombrePlan, venceEn, ahora }: { plan: string | null; venceEn: string; ahora?: number }) {
  const colors = useTheme();

  // Se calcula aquí con la fecha de vencimiento y no con `diasRestantes` del servidor, que queda viejo si la app
  // lleva días abierta.
  const dias = diasHastaVencimiento(venceEn, ahora);
  const porVencer = dias <= 7;
  const vencida = dias < 0;
  const color = vencida ? colors.danger : porVencer ? colors.warning : colors.tint;

  const numero = vencida ? '0' : String(dias);
  const unidad = vencida ? 'Vencida' : dias === 0 ? 'Vence hoy' : dias === 1 ? 'día restante' : 'días restantes';
  const plan = nombrePlan ? `Plan ${nombrePlan}` : 'Tu membresía';

  return (
    <View
      accessible
      accessibilityLabel={`${plan}. ${vencida ? 'Vencida' : dias === 0 ? 'Vence hoy' : `Te quedan ${dias} ${dias === 1 ? 'día' : 'días'}`}. Vence el ${fechaLarga(venceEn)}`}
      style={[
        styles.tarjeta,
        CardShadow,
        { backgroundColor: porVencer ? colors.backgroundSelected : colors.backgroundElement },
      ]}>
      <View style={[styles.icono, { backgroundColor: colors.background }]}>
        <Ionicons name="ribbon-outline" size={24} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>MI MEMBRESÍA</Text>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
          {plan}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Vence el {fechaLarga(venceEn)}</Text>
      </View>

      <View style={styles.dias}>
        <Text style={{ color, fontWeight: '900', fontSize: 30, lineHeight: 34 }}>{numero}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{unidad}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 18,
    padding: Spacing.three,
    alignSelf: 'stretch',
  },
  icono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dias: {
    alignItems: 'center',
    minWidth: 62,
  },
});
