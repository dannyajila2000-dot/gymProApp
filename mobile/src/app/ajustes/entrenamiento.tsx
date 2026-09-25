import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import * as clientesApi from '@/api/clientes';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';

const RESTRICCIONES = [
  {
    valor: 'ninguna' as const,
    icono: 'body-outline' as const,
    titulo: 'No, estoy bien',
    descripcion: 'Puedo hacer cualquier tipo de ejercicio',
  },
  {
    valor: 'impacto_bajo' as const,
    icono: 'walk-outline' as const,
    titulo: 'Impacto bajo',
    descripcion: 'Apto para gente con sobrepeso',
  },
  {
    valor: 'sin_saltos' as const,
    icono: 'footsteps-outline' as const,
    titulo: 'Sin saltos',
    descripcion: 'Sin ruidos, apto para apartamentos',
  },
];

export default function AjustesEntrenamiento() {
  const colors = useTheme();
  const { cliente, actualizarCliente } = useSesion();

  const [restriccionFisica, setRestriccionFisica] = useState(cliente?.restriccionFisica ?? 'ninguna');
  const [preferenciaEntrenador, setPreferenciaEntrenador] = useState(cliente?.preferenciaEntrenador ?? 'animacion');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; esError: boolean } | null>(null);

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const actualizado = await clientesApi.actualizarPerfil({ restriccionFisica, preferenciaEntrenador });
      actualizarCliente(actualizado);
      setMensaje({ texto: 'Ajustes guardados', esError: false });
    } catch (e) {
      setMensaje({ texto: e instanceof ErrorApi ? e.message : 'No pudimos guardar los ajustes', esError: true });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <Text style={[styles.tituloSeccion, { color: colors.text }]}>Preocupaciones físicas</Text>
      <View style={[styles.aviso, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.text }}>
          💊 Filtramos y sustituimos los ejercicios que sean inadecuados para ti
        </Text>
      </View>
      {RESTRICCIONES.map((op) => (
        <TarjetaOpcion
          key={op.valor}
          icono={op.icono}
          titulo={op.titulo}
          descripcion={op.descripcion}
          seleccionado={restriccionFisica === op.valor}
          onPress={() => setRestriccionFisica(op.valor)}
        />
      ))}

      <Text style={[styles.tituloSeccion, { color: colors.text }]}>Entrenador</Text>
      <View style={styles.filaEntrenador}>
        <Pressable
          onPress={() => setPreferenciaEntrenador('animacion')}
          style={[
            styles.tarjetaEntrenador,
            {
              borderColor: preferenciaEntrenador === 'animacion' ? colors.tint : colors.border,
              backgroundColor: colors.backgroundElement,
            },
          ]}>
          <Ionicons name="body" size={40} color={colors.tint} />
          <Text style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.one }}>Animación</Text>
        </Pressable>
        <Pressable
          onPress={() => setPreferenciaEntrenador('video')}
          style={[
            styles.tarjetaEntrenador,
            {
              borderColor: preferenciaEntrenador === 'video' ? colors.tint : colors.border,
              backgroundColor: colors.backgroundElement,
            },
          ]}>
          <Ionicons name="videocam" size={40} color={colors.tint} />
          <Text style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.one }}>Video</Text>
        </Pressable>
      </View>

      {mensaje && (
        <Text style={{ color: mensaje.esError ? colors.danger : colors.tint, fontSize: 13 }}>{mensaje.texto}</Text>
      )}

      <Pressable
        onPress={guardar}
        disabled={guardando}
        style={[styles.boton, { backgroundColor: colors.tint, opacity: guardando ? 0.7 : 1 }]}>
        {guardando ? (
          <ActivityIndicator color={colors.tintForeground} />
        ) : (
          <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  tituloSeccion: { fontSize: 16, fontWeight: '800', marginTop: Spacing.two },
  aviso: { borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.one },
  filaEntrenador: { flexDirection: 'row', gap: Spacing.two },
  tarjetaEntrenador: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
