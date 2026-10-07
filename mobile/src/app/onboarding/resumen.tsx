import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  CONOCIMIENTO,
  DIAS_SEMANA,
  FRECUENCIAS,
  HISTORIAL,
  NIVELES_ACTIVIDAD,
  OBJETIVOS,
  RESTRICCIONES,
  ZONAS,
  horaLegible,
} from '@/lib/onboarding-opciones';

type Ruta =
  | 'objetivo'
  | 'nivel-fitness'
  | 'historial'
  | 'nivel-actividad'
  | 'frecuencia'
  | 'dias-horario'
  | 'altura'
  | 'peso-actual'
  | 'peso-objetivo'
  | 'lesiones'
  | 'restricciones';

export default function Resumen() {
  const colors = useTheme();
  const { respuestas: r } = useOnboarding();

  const dias = DIAS_SEMANA.filter((d) => r.diasEntrenamiento.includes(d.valor))
    .map((d) => d.corto)
    .join(', ');
  const zonas = r.zonasLesion.map((z) => ZONAS.find((x) => x.valor === z)?.etiqueta ?? z).join(', ');

  const filas: { icono: keyof typeof Ionicons.glyphMap; titulo: string; valor: string; ruta: Ruta }[] = [
    { icono: 'flag-outline', titulo: 'Tu objetivo', valor: OBJETIVOS.find((o) => o.valor === r.objetivoPrincipal)?.titulo ?? '—', ruta: 'objetivo' },
    { icono: 'school-outline', titulo: 'Tu conocimiento del gimnasio', valor: CONOCIMIENTO.find((o) => o.valor === r.nivelFitness)?.titulo ?? '—', ruta: 'nivel-fitness' },
    { icono: 'time-outline', titulo: 'Últimos 3 meses', valor: HISTORIAL.find((o) => o.valor === r.historialEntrenamiento)?.titulo ?? '—', ruta: 'historial' },
    { icono: 'walk-outline', titulo: 'Tu actividad diaria', valor: NIVELES_ACTIVIDAD[r.nivelActividad]?.texto ?? '—', ruta: 'nivel-actividad' },
    { icono: 'repeat-outline', titulo: 'Frecuencia', valor: FRECUENCIAS.find((o) => o.valor === r.frecuenciaSemanal)?.titulo ?? '—', ruta: 'frecuencia' },
    {
      icono: 'calendar-outline',
      titulo: 'Días y horario',
      valor: `${dias || '—'} · ${horaLegible(r.horaEntrenamiento)}${r.recordarme ? ' · con recordatorio' : ''}`,
      ruta: 'dias-horario',
    },
    { icono: 'resize-outline', titulo: 'Estatura', valor: `${Math.round(r.alturaCm)} cm`, ruta: 'altura' },
    { icono: 'scale-outline', titulo: 'Peso actual', valor: `${r.pesoActualKg} kg`, ruta: 'peso-actual' },
    { icono: 'trending-down-outline', titulo: 'Peso objetivo', valor: `${r.pesoObjetivoKg} kg`, ruta: 'peso-objetivo' },
    { icono: 'bandage-outline', titulo: 'Lesiones o molestias', valor: zonas || 'Ninguna', ruta: 'lesiones' },
    { icono: 'shield-checkmark-outline', titulo: 'Tipo de ejercicio', valor: RESTRICCIONES.find((o) => o.valor === r.restriccionFisica)?.titulo ?? '—', ruta: 'restricciones' },
  ];

  const completo =
    !!r.objetivoPrincipal &&
    !!r.nivelFitness &&
    r.historialEntrenamiento !== null &&
    !!r.frecuenciaSemanal &&
    r.diasEntrenamiento.length === r.frecuenciaSemanal &&
    !!r.restriccionFisica;

  return (
    <PasoOnboarding
      paso={12}
      titulo="Revisa tus respuestas"
      textoBoton="TODO CORRECTO"
      desplazable
      deshabilitado={!completo}
      onSiguiente={() => router.push('/onboarding/sucursal')}>
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.three }}>
        Con esto armamos tus mejores entrenamientos. Si algo no es correcto, toca Editar.
      </Text>

      <View style={[styles.lista, { backgroundColor: colors.backgroundElement }]}>
        {filas.map((fila, i) => (
          <View
            key={fila.ruta}
            style={[styles.fila, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={[styles.icono, { backgroundColor: colors.backgroundSelected }]}>
              <Ionicons name={fila.icono} size={18} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{fila.titulo}</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{fila.valor}</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: `/onboarding/${fila.ruta}`, params: { editar: '1' } })}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Editar ${fila.titulo}`}>
              <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>Editar</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </PasoOnboarding>
  );
}

const styles = StyleSheet.create({
  lista: {
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 12,
  },
  icono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
