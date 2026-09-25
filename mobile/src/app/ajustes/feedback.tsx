import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import * as feedbackApi from '@/api/feedback';
import type { CategoriaFeedback } from '@/api/feedback';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const CATEGORIAS: { valor: CategoriaFeedback; etiqueta: string }[] = [
  { valor: 'muy_dificil', etiqueta: 'Muy difícil' },
  { valor: 'demasiado_facil', etiqueta: 'Demasiado fácil' },
  { valor: 'errores', etiqueta: 'Errores' },
  { valor: 'sugerencia', etiqueta: 'Sugerencia' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export default function Feedback() {
  const colors = useTheme();
  const [categoria, setCategoria] = useState<CategoriaFeedback | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (!categoria) return;
    setEnviando(true);
    setError(null);
    try {
      await feedbackApi.enviarFeedback({ categoria, mensaje: mensaje.trim() || undefined });
      setEnviado(true);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos enviar tu comentario');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 40 }}>🙌</Text>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, marginTop: Spacing.two }}>
          ¡Gracias por tu comentario!
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.one }}>
          Lo vamos a tomar en cuenta para mejorar la app.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.boton, { backgroundColor: colors.tint, marginTop: Spacing.four }]}>
          <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>
        Por favor, dinos en qué podemos mejorar
      </Text>

      <View style={styles.filaChips}>
        {CATEGORIAS.map((cat) => (
          <Pressable
            key={cat.valor}
            onPress={() => setCategoria(cat.valor)}
            style={[
              styles.chip,
              {
                backgroundColor: categoria === cat.valor ? colors.tint : colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}>
            <Text style={{ color: categoria === cat.valor ? colors.tintForeground : colors.text, fontSize: 13 }}>
              {cat.etiqueta}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={mensaje}
        onChangeText={setMensaje}
        placeholder="Cuéntanos más detalles sobre tus comentarios o sugerencias"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={6}
        style={[styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }]}
      />

      {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}

      <Pressable
        onPress={enviar}
        disabled={!categoria || enviando}
        style={[styles.boton, { backgroundColor: colors.tint, opacity: !categoria || enviando ? 0.5 : 1 }]}>
        {enviando ? (
          <ActivityIndicator color={colors.tintForeground} />
        ) : (
          <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Enviar</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  contenedor: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  textarea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    minHeight: 140,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
