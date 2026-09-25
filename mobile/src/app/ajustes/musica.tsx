import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { guardarPista, obtenerPistaGuardada, quitarPista } from '@/lib/musica';
import type { PistaMusica } from '@/lib/musica';

export default function Musica() {
  const colors = useTheme();
  const [pista, setPista] = useState<PistaMusica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    obtenerPistaGuardada()
      .then(setPista)
      .finally(() => setCargando(false));
  }, []);

  async function importar() {
    setProcesando(true);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (resultado.canceled || !resultado.assets?.[0]) return;
      const archivo = resultado.assets[0];
      const nueva: PistaMusica = { uri: archivo.uri, nombre: archivo.name };
      await guardarPista(nueva);
      setPista(nueva);
    } finally {
      setProcesando(false);
    }
  }

  async function quitar() {
    await quitarPista();
    setPista(null);
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={[styles.iconoWrap, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="musical-notes" size={40} color={colors.tint} />
      </View>

      {pista ? (
        <>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>
            {pista.nombre}
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.four }}>
            Se reproducirá en bucle durante tus entrenamientos
          </Text>
          <Pressable onPress={quitar} style={[styles.boton, styles.botonSecundario, { borderColor: colors.danger }]}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Quitar música</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ color: colors.text, textAlign: 'center', marginBottom: Spacing.four }}>
            Puedes importar tu música favorita desde tu teléfono para disfrutarla durante el entrenamiento
          </Text>
          <Pressable
            onPress={importar}
            disabled={procesando}
            style={[styles.boton, { backgroundColor: colors.tint, opacity: procesando ? 0.7 : 1 }]}>
            {procesando ? (
              <ActivityIndicator color={colors.tintForeground} />
            ) : (
              <>
                <Ionicons name="add" size={18} color={colors.tintForeground} />
                <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Importar música</Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  iconoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
  },
  botonSecundario: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
});
