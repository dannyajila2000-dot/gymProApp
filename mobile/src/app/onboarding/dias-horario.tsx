import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ChipSeleccion } from '@/components/onboarding/chip-seleccion';
import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { DIAS_SEMANA, DIAS_SUGERIDOS } from '@/lib/onboarding-opciones';

function horaAFecha(hora: string) {
  const fecha = new Date();
  const [horas, minutos] = hora.split(':').map(Number);
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
}

function fechaAHora(fecha: Date) {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

export default function DiasHorario() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const frecuencia = respuestas.frecuenciaSemanal ?? 3;
  const dias = respuestas.diasEntrenamiento;
  const completo = dias.length === frecuencia;

  function alternarDia(valor: number) {
    if (dias.includes(valor)) {
      actualizar({ diasEntrenamiento: dias.filter((d) => d !== valor) });
    } else if (dias.length < frecuencia) {
      actualizar({ diasEntrenamiento: [...dias, valor] });
    }
  }

  return (
    <PasoOnboarding
      paso={6}
      titulo="¿Qué días y a qué hora te conviene?"
      desplazable
      deshabilitado={!completo}
      onSiguiente={() => router.push('/onboarding/altura')}>
      <View style={styles.encabezadoSeccion}>
        <Text style={[styles.seccion, { color: colors.text }]}>Tus días de entrenamiento</Text>
        <Text style={{ color: completo ? colors.tint : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
          {dias.length} de {frecuencia}
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: Spacing.three }}>
        {completo
          ? 'Listo. Puedes cambiar tus días tocándolos.'
          : `Elige ${frecuencia} ${frecuencia === 1 ? 'día' : 'días'} para entrenar.`}
      </Text>

      <View style={styles.dias}>
        {DIAS_SEMANA.map((dia) => (
          <ChipSeleccion
            key={dia.valor}
            etiqueta={dia.corto}
            seleccionado={dias.includes(dia.valor)}
            deshabilitado={!dias.includes(dia.valor) && dias.length >= frecuencia}
            onPress={() => alternarDia(dia.valor)}
          />
        ))}
      </View>
      <Pressable onPress={() => actualizar({ diasEntrenamiento: DIAS_SUGERIDOS[frecuencia] })} hitSlop={8} style={styles.sugerir}>
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Sugerirme los días</Text>
      </Pressable>

      <View style={[styles.separador, { backgroundColor: colors.border }]} />

      <View style={styles.encabezadoSeccion}>
        <Text style={[styles.seccion, { color: colors.text }]}>¿A qué hora prefieres entrenar?</Text>
      </View>

      <DateTimePicker
        value={horaAFecha(respuestas.horaEntrenamiento)}
        mode="time"
        display="spinner"
        onChange={(_evento, fecha) => {
          if (fecha) actualizar({ horaEntrenamiento: fechaAHora(fecha) });
        }}
        style={{ alignSelf: 'center' }}
      />

      <View style={[styles.recordatorio, { backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Recordarme a esta hora</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Te avisamos solo los días que elegiste.</Text>
        </View>
        <Switch
          value={respuestas.recordarme}
          onValueChange={(valor) => actualizar({ recordarme: valor })}
          trackColor={{ true: colors.tintFondo }}
        />
      </View>
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  encabezadoSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  seccion: {
    fontSize: 16,
    fontWeight: '800',
  },
  dias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sugerir: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
  },
  separador: {
    height: 1,
    marginVertical: Spacing.four,
  },
  recordatorio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
});
