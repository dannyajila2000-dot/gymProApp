import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorApi } from '@/api/client';
import { useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function Registro() {
  const colors = useTheme();
  const { registrarse } = useSesion();

  const [codigoGimnasio, setCodigoGimnasio] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setError(null);
    if (!codigoGimnasio || !nombres || !apellidos || !email || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setCargando(true);
    try {
      await registrarse({
        codigoGimnasio: codigoGimnasio.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        password,
      });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos conectar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={[styles.titulo, { color: colors.text }]}>Crea tu cuenta</Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
          Necesitas el código que te dio tu gimnasio
        </Text>

        <View style={styles.campos}>
          <Campo
            etiqueta="Código de gimnasio"
            valor={codigoGimnasio}
            onCambiar={setCodigoGimnasio}
            autoCapitalize="characters"
            placeholder="Ej. PGPLANADA"
          />
          <View style={styles.fila}>
            <View style={styles.mitad}>
              <Campo etiqueta="Nombres" valor={nombres} onCambiar={setNombres} placeholder="Juan" />
            </View>
            <View style={styles.mitad}>
              <Campo etiqueta="Apellidos" valor={apellidos} onCambiar={setApellidos} placeholder="Pérez" />
            </View>
          </View>
          <Campo
            etiqueta="Correo electrónico"
            valor={email}
            onCambiar={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="tucorreo@ejemplo.com"
          />
          <Campo
            etiqueta="Contraseña"
            valor={password}
            onCambiar={setPassword}
            secureTextEntry
            placeholder="Mínimo 8 caracteres"
          />
        </View>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <Pressable
          onPress={enviar}
          disabled={cargando}
          style={[styles.boton, { backgroundColor: colors.tint, opacity: cargando ? 0.7 : 1 }]}>
          {cargando ? (
            <ActivityIndicator color={colors.tintForeground} />
          ) : (
            <Text style={[styles.botonTexto, { color: colors.tintForeground }]}>Crear cuenta</Text>
          )}
        </Pressable>

        <View style={styles.pieDePagina}>
          <Text style={{ color: colors.textSecondary }}>¿Ya tienes cuenta? </Text>
          <Link href="/(auth)/login" replace>
            <Text style={{ color: colors.tint, fontWeight: '700' }}>Inicia sesión</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement },
        ]}
        placeholderTextColor={colors.textSecondary}
        {...resto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  titulo: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 15,
    marginTop: -Spacing.two,
  },
  campos: {
    gap: Spacing.three,
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mitad: {
    flex: 1,
  },
  campo: {
    gap: Spacing.one,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    fontWeight: '600',
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '700',
  },
  pieDePagina: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
