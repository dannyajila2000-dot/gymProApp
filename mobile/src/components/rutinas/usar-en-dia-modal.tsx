import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { DiaPlan } from '@/api/rutinas';
import { Spacing } from '@/constants/theme';
import { DIAS_NOMBRE_LARGO } from '@/constants/dias';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  rutina: { id: string; nombre: string };
  onCerrar: () => void;
  onListo?: () => void;
};

/**
 * Elige en qué día de la semana se usa una rutina. Cada día tiene una sola
 * rutina, así que la elegida reemplaza la que hubiera (automática o fijada).
 */
export function UsarEnDiaModal({ rutina, onCerrar, onListo }: Props) {
  const colors = useTheme();
  const [plan, setPlan] = useState<DiaPlan[] | null>(null);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    rutinasApi
      .obtenerPlanSemana()
      .then((dias) => {
        if (!cancelado) setPlan(dias);
      })
      .catch(() => {
        if (!cancelado) setError('No pudimos cargar tu semana.');
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function elegir(diaSemana: number) {
    setGuardando(diaSemana);
    setError(null);
    try {
      await rutinasApi.fijarRutinaEnDia(diaSemana, rutina.id);
      onListo?.();
      onCerrar();
    } catch {
      setError('No pudimos guardar el cambio. Inténtalo de nuevo.');
      setGuardando(null);
    }
  }

  const indiceHoy = plan?.findIndex((d) => d.esHoy) ?? -1;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.filaEncabezado}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titulo, { color: colors.text }]}>Agregar a rutina</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>
                {rutina.nombre} reemplaza la rutina del día que elijas.
              </Text>
            </View>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}

          {!plan && !error ? (
            <ActivityIndicator color={colors.tint} style={{ marginVertical: Spacing.four }} />
          ) : (
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: Spacing.one, paddingBottom: Spacing.three }}>
              {plan?.map((dia, indice) => {
                const yaEsEsta = dia.rutinaId === rutina.id;
                // Los días anteriores a hoy ya pasaron: no se pueden cambiar.
                const pasado = indiceHoy !== -1 && indice < indiceHoy;
                return (
                  <Pressable
                    key={dia.diaSemana}
                    disabled={guardando !== null || yaEsEsta || pasado}
                    onPress={() => elegir(dia.diaSemana)}
                    style={[
                      styles.filaDia,
                      { backgroundColor: yaEsEsta ? colors.backgroundSelected : colors.backgroundElement },
                      pasado && { opacity: 0.5 },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700' }}>
                        {DIAS_NOMBRE_LARGO[dia.diaSemana]}
                        {dia.esHoy ? ' · hoy' : ''}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>
                        {pasado
                          ? 'Día pasado'
                          : dia.rutinaNombre
                            ? `${dia.fijadaPorCliente ? 'Personalizada' : 'Automática'}: ${dia.rutinaNombre}`
                            : 'Descanso'}
                      </Text>
                    </View>
                    {guardando === dia.diaSemana ? (
                      <ActivityIndicator color={colors.tint} size="small" />
                    ) : pasado ? (
                      <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                    ) : yaEsEsta ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
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
    gap: Spacing.two,
  },
  filaEncabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  titulo: { fontSize: 18, fontWeight: '800' },
  filaDia: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 14, padding: Spacing.three },
});
