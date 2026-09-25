import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorApi } from '@/api/client';
import * as clientesApi from '@/api/clientes';
import * as authApi from '@/api/auth';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

function formatearFecha(iso: string | null) {
  if (!iso) return 'Seleccionar';
  const fecha = new Date(`${iso}T00:00:00`);
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MiPerfil() {
  const colors = useTheme();
  const { cliente, actualizarCliente } = useSesion();

  const [nombres, setNombres] = useState(cliente?.nombres ?? '');
  const [apellidos, setApellidos] = useState(cliente?.apellidos ?? '');
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(cliente?.fechaNacimiento ?? null);
  const [unidadPeso, setUnidadPeso] = useState(cliente?.unidadPeso ?? 'kg');
  const [unidadAltura, setUnidadAltura] = useState(cliente?.unidadAltura ?? 'cm');
  const [mostrarFecha, setMostrarFecha] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; esError: boolean } | null>(null);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState<{ texto: string; esError: boolean } | null>(null);

  async function guardarPerfil() {
    setGuardando(true);
    setMensaje(null);
    try {
      const actualizado = await clientesApi.actualizarPerfil({
        nombres: nombres.trim() || undefined,
        apellidos: apellidos.trim() || undefined,
        telefono: telefono.trim() || undefined,
        fechaNacimiento: fechaNacimiento ?? undefined,
        unidadPeso,
        unidadAltura,
      });
      actualizarCliente(actualizado);
      setMensaje({ texto: 'Perfil actualizado', esError: false });
    } catch (e) {
      setMensaje({ texto: e instanceof ErrorApi ? e.message : 'No pudimos guardar tu perfil', esError: true });
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPassword() {
    setMensajePassword(null);
    if (passwordNueva.length < 8) {
      setMensajePassword({ texto: 'La contraseña nueva debe tener al menos 8 caracteres', esError: true });
      return;
    }
    setCambiandoPassword(true);
    try {
      await authApi.cambiarPassword({ passwordActual, passwordNueva });
      setPasswordActual('');
      setPasswordNueva('');
      setMensajePassword({ texto: 'Contraseña actualizada', esError: false });
    } catch (e) {
      setMensajePassword({
        texto: e instanceof ErrorApi ? e.message : 'No pudimos cambiar tu contraseña',
        esError: true,
      });
    } finally {
      setCambiandoPassword(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Campo etiqueta="Nombres" valor={nombres} onCambiar={setNombres} />
        <Campo etiqueta="Apellidos" valor={apellidos} onCambiar={setApellidos} />
        <Campo etiqueta="Teléfono" valor={telefono} onCambiar={setTelefono} keyboardType="phone-pad" />

        <View style={styles.campo}>
          <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Fecha de nacimiento</Text>
          <Pressable
            onPress={() => setMostrarFecha(true)}
            style={[styles.input, styles.filaEntre, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>{formatearFecha(fechaNacimiento)}</Text>
          </Pressable>
        </View>
        {mostrarFecha && (
          <DateTimePicker
            value={fechaNacimiento ? new Date(`${fechaNacimiento}T00:00:00`) : new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={(_evento, fecha) => {
              setMostrarFecha(Platform.OS === 'ios');
              if (fecha) setFechaNacimiento(fecha.toISOString().slice(0, 10));
            }}
          />
        )}

        <View style={styles.campo}>
          <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Unidad de peso</Text>
          <ToggleDos valor={unidadPeso} opciones={['kg', 'lb']} onCambiar={(v) => setUnidadPeso(v as 'kg' | 'lb')} />
        </View>

        <View style={styles.campo}>
          <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Unidad de altura</Text>
          <ToggleDos valor={unidadAltura} opciones={['cm', 'in']} onCambiar={(v) => setUnidadAltura(v as 'cm' | 'in')} />
        </View>

        {mensaje && (
          <Text style={{ color: mensaje.esError ? colors.danger : colors.tint, fontSize: 13 }}>{mensaje.texto}</Text>
        )}

        <Pressable
          onPress={guardarPerfil}
          disabled={guardando}
          style={[styles.boton, { backgroundColor: colors.tint, opacity: guardando ? 0.7 : 1 }]}>
          {guardando ? (
            <ActivityIndicator color={colors.tintForeground} />
          ) : (
            <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar</Text>
          )}
        </Pressable>
      </View>

      <Text style={[styles.tituloSeccion, { color: colors.text }]}>Cambiar contraseña</Text>
      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Campo etiqueta="Contraseña actual" valor={passwordActual} onCambiar={setPasswordActual} secureTextEntry />
        <Campo etiqueta="Contraseña nueva" valor={passwordNueva} onCambiar={setPasswordNueva} secureTextEntry />

        {mensajePassword && (
          <Text style={{ color: mensajePassword.esError ? colors.danger : colors.tint, fontSize: 13 }}>
            {mensajePassword.texto}
          </Text>
        )}

        <Pressable
          onPress={cambiarPassword}
          disabled={cambiandoPassword || !passwordActual || !passwordNueva}
          style={[
            styles.boton,
            { backgroundColor: colors.tint, opacity: cambiandoPassword || !passwordActual || !passwordNueva ? 0.5 : 1 },
          ]}>
          {cambiandoPassword ? (
            <ActivityIndicator color={colors.tintForeground} />
          ) : (
            <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Actualizar contraseña</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Campo({
  etiqueta,
  valor,
  onCambiar,
  ...resto
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
} & React.ComponentProps<typeof TextInput>) {
  const colors = useTheme();
  return (
    <View style={styles.campo}>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholderTextColor={colors.textSecondary}
        {...resto}
      />
    </View>
  );
}

function ToggleDos({
  valor,
  opciones,
  onCambiar,
}: {
  valor: string;
  opciones: [string, string];
  onCambiar: (valor: string) => void;
}) {
  const colors = useTheme();
  return (
    <View style={styles.toggleFila}>
      {opciones.map((opcion) => (
        <Pressable
          key={opcion}
          onPress={() => onCambiar(opcion)}
          style={[
            styles.toggleBoton,
            { backgroundColor: valor === opcion ? colors.tint : colors.background, borderColor: colors.border },
          ]}>
          <Text style={{ color: valor === opcion ? colors.tintForeground : colors.text, fontWeight: '700' }}>
            {opcion}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  tarjeta: { borderRadius: 18, padding: Spacing.three, gap: Spacing.three },
  campo: { gap: Spacing.one },
  etiqueta: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 15,
  },
  filaEntre: { justifyContent: 'center' },
  toggleFila: { flexDirection: 'row', gap: Spacing.two },
  toggleBoton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloSeccion: { fontSize: 16, fontWeight: '800', marginTop: Spacing.two },
});
