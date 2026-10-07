import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/client';
import { asignarme } from '@/api/rutinas';
import { BotonOnboarding } from '@/components/onboarding/boton-onboarding';
import { useSesion } from '@/context/auth-context';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { CardShadow, Spacing } from '@/constants/theme';

/** Última pantalla: el cliente elige cuál de las rutinas recomendadas va a entrenar. */
export default function Recomendaciones() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { respuestas, resultado } = useOnboarding();
  const { actualizarCliente } = useSesion();
  const recomendaciones = resultado?.recomendaciones ?? [];
  // Mientras el cliente no toque nada, queda marcada la que el servidor dejó asignada (la mejor para él).
  const [eleccion, setElegida] = useState<string | null>(null);
  const elegida = eleccion ?? resultado?.rutinaAsignadaId ?? recomendaciones[0]?.rutinaId ?? null;
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function empezar() {
    setGuardando(true);
    setError(null);
    try {
      // La primera ya quedó asignada al terminar la encuesta: solo se llama al servidor si elige otra.
      if (elegida && elegida !== resultado?.rutinaAsignadaId) await asignarme(elegida);
      // Marcar el onboarding como completado cierra este flujo y lleva a la app.
      actualizarCliente({
        onboardingCompletado: true,
        alturaCm: Math.round(respuestas.alturaCm),
        diasEntrenamientoSemana: [...respuestas.diasEntrenamiento].sort((a, b) => a - b),
      });
      router.replace('/(tabs)');
    } catch (e) {
      setGuardando(false);
      setError(e instanceof ErrorApi ? e.message : 'No pudimos guardar tu elección. Inténtalo de nuevo.');
    }
  }

  return (
    <View
      style={[
        styles.contenedor,
        { backgroundColor: colors.background, paddingTop: Math.max(Spacing.six, insets.top + Spacing.three), paddingBottom: Spacing.three + insets.bottom },
      ]}>
      <Text style={[styles.titulo, { color: colors.text }]}>
        {recomendaciones.length ? 'Tus mejores entrenamientos' : '¡Listo!'}
      </Text>
      <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
        {recomendaciones.length
          ? 'Elegimos estas rutinas según tus respuestas. Escoge con cuál quieres empezar.'
          : 'Tu gimnasio aún no tiene una rutina que encaje con tu perfil. Cuando la tenga, la verás en la pestaña Rutina.'}
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: Spacing.three, paddingVertical: Spacing.two }} showsVerticalScrollIndicator={false}>
        {recomendaciones.map((rec, indice) => {
          const activa = elegida === rec.rutinaId;
          return (
            <Pressable
              key={rec.rutinaId}
              onPress={() => setElegida(rec.rutinaId)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              style={[
                styles.tarjeta,
                CardShadow,
                {
                  backgroundColor: colors.background,
                  borderColor: activa ? colors.tintFondo : colors.border,
                },
              ]}>
              <View style={styles.cabeza}>
                <View style={{ flex: 1, gap: 6 }}>
                  {indice === 0 && (
                    <View style={[styles.etiqueta, { backgroundColor: colors.tintFondo }]}>
                      <Ionicons name="star" size={12} color={colors.tintForeground} />
                      <Text style={{ color: colors.tintForeground, fontSize: 11, fontWeight: '800' }}>La mejor para ti</Text>
                    </View>
                  )}
                  <Text style={[styles.nombre, { color: colors.text }]}>{rec.nombre}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: activa ? colors.tintFondo : colors.border, backgroundColor: activa ? colors.tintFondo : 'transparent' },
                  ]}>
                  {activa && <Ionicons name="checkmark" size={14} color={colors.tintForeground} />}
                </View>
              </View>
              {rec.motivos.map((motivo) => (
                <View key={motivo} style={styles.motivo}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>{motivo}</Text>
                </View>
              ))}
            </Pressable>
          );
        })}
      </ScrollView>

      {error && <Text style={{ color: colors.danger, textAlign: 'center', marginBottom: Spacing.two }}>{error}</Text>}

      <BotonOnboarding onPress={empezar} fondo={colors.tintFondo} deshabilitado={guardando} style={styles.boton}>
        {guardando ? (
          <ActivityIndicator color={colors.tintForeground} />
        ) : (
          <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>
            {recomendaciones.length ? 'EMPEZAR CON ESTA RUTINA' : 'IR A MI INICIO'}
          </Text>
        )}
      </BotonOnboarding>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: Spacing.six,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
    lineHeight: 21,
  },
  tarjeta: {
    borderRadius: 20,
    borderWidth: 2,
    padding: Spacing.three,
    gap: 8,
  },
  cabeza: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '800',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  boton: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
