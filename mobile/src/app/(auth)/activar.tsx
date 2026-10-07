import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorApi } from '@/api/client';
import { BotonOnboarding } from '@/components/onboarding/boton-onboarding';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

/**
 * Un socio que su gimnasio dio de alta (y ya invitó a la app) activa aquí su cuenta: el código del gimnasio, su
 * correo, el código de 6 dígitos que le llegó y la contraseña que va a usar.
 */
export default function ActivarCuenta() {
  const colors = useTheme();
  const { activarCuenta } = useSesion();

  const [codigoGimnasio, setCodigoGimnasio] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const faltaAlgo = !codigoGimnasio.trim() || !email.trim() || codigo.length !== 6 || password.length < 8;

  async function activar() {
    if (password !== repetir) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await activarCuenta({
        codigoGimnasio: codigoGimnasio.trim(),
        email: email.trim().toLowerCase(),
        codigo,
        password,
      });
      // La sesión queda iniciada: el navegador raíz lleva al onboarding.
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos activar tu cuenta. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  const campo = [styles.input, { borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior="padding">
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <View style={[styles.icono, { backgroundColor: colors.backgroundSelected }]}>
          <Ionicons name="key-outline" size={34} color={colors.tint} />
        </View>
        <Text style={[styles.titulo, { color: colors.text }]}>Activa tu cuenta</Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
          Tu gimnasio te invitó a la app. Escribe los datos que te enviaron por correo.
        </Text>

        <Text style={[styles.etiqueta, { color: colors.text }]}>Código del gimnasio</Text>
        <TextInput
          style={campo}
          value={codigoGimnasio}
          onChangeText={setCodigoGimnasio}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Ej. GYM-1234"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.etiqueta, { color: colors.text }]}>Tu correo</Text>
        <TextInput
          style={campo}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="correo@ejemplo.com"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.etiqueta, { color: colors.text }]}>Código de activación</Text>
        <TextInput
          style={[...campo, styles.codigo]}
          value={codigo}
          onChangeText={(texto) => setCodigo(texto.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.etiqueta, { color: colors.text }]}>Elige tu contraseña</Text>
        <TextInput
          style={campo}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          style={campo}
          value={repetir}
          onChangeText={setRepetir}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Repite tu contraseña"
          placeholderTextColor={colors.textSecondary}
        />

        {error && <Text style={{ color: colors.danger, textAlign: 'center' }}>{error}</Text>}

        <BotonOnboarding onPress={activar} fondo={colors.tintFondo} deshabilitado={faltaAlgo || cargando} style={styles.boton}>
          {cargando ? (
            <ActivityIndicator color={colors.tintForeground} />
          ) : (
            <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>Activar mi cuenta</Text>
          )}
        </BotonOnboarding>
        {cargando && (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 12 }}>
            Puede tardar unos segundos mientras conectamos con tu gimnasio…
          </Text>
        )}

        <View style={styles.pie}>
          <Text style={{ color: colors.textSecondary }}>¿Ya activaste tu cuenta? </Text>
          <Link href="/(auth)/login" replace>
            <Text style={{ color: colors.tint, fontWeight: '700' }}>Inicia sesión</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: Spacing.five,
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  icono: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  subtitulo: {
    textAlign: 'center',
    marginBottom: Spacing.three,
    lineHeight: 21,
  },
  etiqueta: {
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  codigo: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '800',
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
});
