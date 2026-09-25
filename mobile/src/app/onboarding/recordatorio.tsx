import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

function horaAFecha(hora: string | null) {
  const fecha = new Date();
  const [horas, minutos] = (hora ?? '20:00').split(':').map(Number);
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
}

function fechaAHora(fecha: Date) {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

export default function Recordatorio() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const activo = respuestas.horaRecordatorio !== null;

  return (
    <PasoOnboarding
      paso={7}
      titulo="Recordatorio para hacer ejercicio"
      textoBoton="FINALIZAR"
      onSiguiente={() => router.push('/onboarding/generando')}>
      <View style={[styles.aviso, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.text }}>
          ⏰ El recordatorio inteligente ayuda a conseguir tu objetivo más rápido
        </Text>
      </View>

      {activo && (
        <DateTimePicker
          value={horaAFecha(respuestas.horaRecordatorio)}
          mode="time"
          display="spinner"
          onChange={(_evento, fecha) => {
            if (fecha) actualizar({ horaRecordatorio: fechaAHora(fecha) });
          }}
          style={{ alignSelf: 'center' }}
        />
      )}

      <Pressable
        onPress={() => actualizar({ horaRecordatorio: activo ? null : '20:00' })}
        style={styles.filaCheckbox}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: !activo ? colors.tint : colors.border,
              backgroundColor: !activo ? colors.tint : 'transparent',
            },
          ]}
        />
        <Text style={{ color: colors.textSecondary }}>No, no lo necesito</Text>
      </Pressable>
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  aviso: {
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  filaCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
});
