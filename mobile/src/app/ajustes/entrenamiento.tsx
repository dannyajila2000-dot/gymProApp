import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import * as clientesApi from '@/api/clientes';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { DIAS_CORTOS } from '@/constants/dias';

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
  const [guiaDeVozActiva, setGuiaDeVozActiva] = useState(cliente?.guiaDeVozActiva ?? true);
  const [cuentaAtrasSeg, setCuentaAtrasSeg] = useState(cliente?.cuentaAtrasSeg ?? 5);
  const [volumenMusica, setVolumenMusica] = useState(cliente?.volumenMusica ?? 0.5);
  const [bajarVolumenConVoz, setBajarVolumenConVoz] = useState(cliente?.bajarVolumenConVoz ?? true);
  const [diasEntrenamientoSemana, setDiasEntrenamientoSemana] = useState(cliente?.diasEntrenamientoSemana ?? []);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; esError: boolean } | null>(null);

  function alternarDia(dia: number) {
    setDiasEntrenamientoSemana((actual) =>
      actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia].sort(),
    );
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const actualizado = await clientesApi.actualizarPerfil({
        restriccionFisica,
        preferenciaEntrenador,
        guiaDeVozActiva,
        cuentaAtrasSeg,
        volumenMusica,
        bajarVolumenConVoz,
        diasEntrenamientoSemana,
      });
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

      <Text style={[styles.tituloSeccion, { color: colors.text }]}>Días de entrenamiento</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginBottom: 4 }}>
        Elige qué días entrenas. El resto los marcamos como descanso en tu Inicio.
      </Text>
      <View style={styles.filaDias}>
        {DIAS_CORTOS.map((letra, indice) => (
          <Pressable
            key={indice}
            onPress={() => alternarDia(indice)}
            style={[
              styles.diaCirculo,
              {
                backgroundColor: diasEntrenamientoSemana.includes(indice) ? colors.tint : colors.backgroundElement,
              },
            ]}>
            <Text
              style={{
                color: diasEntrenamientoSemana.includes(indice) ? colors.tintForeground : colors.textSecondary,
                fontWeight: '700',
              }}>
              {letra}
            </Text>
          </Pressable>
        ))}
      </View>

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

      <Text style={[styles.tituloSeccion, { color: colors.text }]}>Música</Text>
      <Pressable
        onPress={() => router.push('/ajustes/musica')}
        style={[styles.filaAjuste, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="musical-notes-outline" size={20} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>Elegir música</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <View style={[styles.filaAjuste, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="volume-low" size={18} color={colors.textSecondary} />
        <Slider
          value={volumenMusica}
          minimumValue={0}
          maximumValue={1}
          step={0.05}
          minimumTrackTintColor={colors.tint}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.tint}
          onValueChange={setVolumenMusica}
          style={{ flex: 1 }}
        />
        <Ionicons name="volume-high" size={18} color={colors.textSecondary} />
      </View>

      <View style={[styles.filaAjuste, { backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Bajar volumen con la voz</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
            Baja la música mientras el entrenador habla
          </Text>
        </View>
        <Switch value={bajarVolumenConVoz} onValueChange={setBajarVolumenConVoz} trackColor={{ true: colors.tint }} />
      </View>

      <Text style={[styles.tituloSeccion, { color: colors.text }]}>Voz y cuenta atrás</Text>
      <View style={[styles.filaAjuste, { backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Guía de voz</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
            Anuncia cada ejercicio y el descanso en voz alta
          </Text>
        </View>
        <Switch value={guiaDeVozActiva} onValueChange={setGuiaDeVozActiva} trackColor={{ true: colors.tint }} />
      </View>

      <View style={[styles.filaAjuste, { backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Cuenta atrás antes de empezar</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Antes de que empiece el entrenamiento</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setCuentaAtrasSeg((s) => Math.max(0, s - 5))}
            style={[styles.stepperBoton, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>-5s</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, minWidth: 40, textAlign: 'center' }}>
            {cuentaAtrasSeg}s
          </Text>
          <Pressable
            onPress={() => setCuentaAtrasSeg((s) => Math.min(15, s + 5))}
            style={[styles.stepperBoton, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>+5s</Text>
          </Pressable>
        </View>
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
  filaDias: { flexDirection: 'row', justifyContent: 'space-between' },
  diaCirculo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  filaAjuste: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperBoton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
});
