import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { Rutina, RutinaFijadaPorDia } from '@/api/rutinas';
import { DIAS_NOMBRE_LARGO } from '@/constants/dias';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  diaSemana: number;
  onCerrar: () => void;
  onListo: () => void;
};

/**
 * Cambia la rutina de un día de la semana: por una propia, por una del
 * catálogo, o vuelve a la automática (la que sugiere la app según el
 * onboarding). Cada día tiene una sola rutina.
 */
export function CambiarRutinaDiaModal({ diaSemana, onCerrar, onListo }: Props) {
  const colors = useTheme();
  const [fijada, setFijada] = useState<RutinaFijadaPorDia | null>(null);
  const [disponibles, setDisponibles] = useState<Rutina[]>([]);
  const [propias, setPropias] = useState<Rutina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    Promise.all([rutinasApi.listarDiasFijados(), rutinasApi.listarRutinas(), rutinasApi.misRutinasPersonales()])
      .then(([fijadas, catalogo, mias]) => {
        if (cancelado) return;
        setFijada(fijadas.find((f) => f.diaSemana === diaSemana) ?? null);
        setDisponibles(catalogo);
        setPropias(mias);
      })
      .catch(() => {
        if (!cancelado) setError('No pudimos cargar las rutinas.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [diaSemana]);

  async function guardar(clave: string, accion: () => Promise<unknown>) {
    setGuardando(clave);
    setError(null);
    try {
      await accion();
      onListo();
      onCerrar();
    } catch {
      setError('No pudimos guardar el cambio. Inténtalo de nuevo.');
      setGuardando(null);
    }
  }

  function renderOpcion(rutina: Rutina, etiqueta?: string) {
    const activa = fijada?.rutina.id === rutina.id;
    return (
      <Pressable
        key={rutina.id}
        disabled={!!guardando}
        onPress={() => guardar(rutina.id, () => rutinasApi.fijarRutinaEnDia(diaSemana, rutina.id))}
        style={[styles.filaOpcion, { backgroundColor: activa ? colors.backgroundSelected : colors.backgroundElement }]}>
        <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>
            {rutina.nombre}
          </Text>
          {etiqueta && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{etiqueta}</Text>}
        </View>
        {guardando === rutina.id ? (
          <ActivityIndicator color={colors.tint} size="small" />
        ) : activa ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
        ) : null}
      </Pressable>
    );
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.contenido, { backgroundColor: colors.background }]}>
          <View style={styles.filaEncabezado}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titulo, { color: colors.text }]}>{DIAS_NOMBRE_LARGO[diaSemana]}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Elige la rutina de este día.</Text>
            </View>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}

          {cargando ? (
            <ActivityIndicator color={colors.tint} style={{ marginVertical: Spacing.four }} />
          ) : (
            <>
              <Pressable
                onPress={() => guardar('__automatico__', () => rutinasApi.quitarRutinaDeDia(diaSemana))}
                disabled={!!guardando || !fijada}
                style={[styles.filaOpcion, { backgroundColor: colors.backgroundSelected, opacity: fijada ? 1 : 0.6 }]}>
                <Ionicons name="shuffle-outline" size={20} color={colors.tint} />
                <Text style={{ color: colors.tint, fontWeight: '700', flex: 1 }}>
                  {fijada ? 'Volver a automática' : 'Automática (la sugerida para ti)'}
                </Text>
                {guardando === '__automatico__' ? (
                  <ActivityIndicator color={colors.tint} size="small" />
                ) : !fijada ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                ) : null}
              </Pressable>

              <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: Spacing.one, paddingBottom: Spacing.three }}>
                {propias.length > 0 && (
                  <Text style={[styles.grupo, { color: colors.textSecondary }]}>Mis rutinas</Text>
                )}
                {propias.map((rutina) => renderOpcion(rutina))}
                <Text style={[styles.grupo, { color: colors.textSecondary }]}>Rutinas del gimnasio</Text>
                {disponibles.map((rutina) => renderOpcion(rutina, `${rutina.ejercicios.length} ejercicios`))}
              </ScrollView>
            </>
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
  grupo: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: Spacing.one },
  filaOpcion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 14, padding: Spacing.two },
});
