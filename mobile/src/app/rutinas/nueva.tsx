import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import { OBJETIVO_LABEL } from '@/constants/objetivos';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const NIVELES: { valor: string; etiqueta: string }[] = [
  { valor: 'principiante', etiqueta: 'Principiante' },
  { valor: 'intermedio', etiqueta: 'Intermedio' },
  { valor: 'avanzado', etiqueta: 'Avanzado' },
];

const OBJETIVOS = Object.keys(OBJETIVO_LABEL);

export default function NuevaRutina() {
  const colors = useTheme();
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState('intermedio');
  const [objetivo, setObjetivo] = useState('cuerpo_completo');
  const [creando, setCreando] = useState(false);

  async function crear() {
    if (!nombre.trim()) return;
    setCreando(true);
    try {
      const rutina = await rutinasApi.crearRutinaPersonal({ nombre: nombre.trim(), nivel, objetivo });
      router.replace({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: rutina.id } });
    } finally {
      setCreando(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      <Text style={[styles.titulo, { color: colors.text }]}>Diseña tu rutina</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: Spacing.three }}>
        Ponle un nombre y elige el nivel y objetivo. Luego podrás agregar los ejercicios.
      </Text>

      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Nombre</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Mi rutina de piernas"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Nivel</Text>
      <View style={styles.filaChips}>
        {NIVELES.map((op) => (
          <Pressable
            key={op.valor}
            onPress={() => setNivel(op.valor)}
            style={[
              styles.chip,
              { backgroundColor: nivel === op.valor ? colors.tint : colors.backgroundElement, borderColor: colors.border },
            ]}>
            <Text style={{ color: nivel === op.valor ? colors.tintForeground : colors.text, fontWeight: '700', fontSize: 13 }}>
              {op.etiqueta}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Objetivo</Text>
      <View style={styles.filaChips}>
        {OBJETIVOS.map((valor) => (
          <Pressable
            key={valor}
            onPress={() => setObjetivo(valor)}
            style={[
              styles.chip,
              { backgroundColor: objetivo === valor ? colors.tint : colors.backgroundElement, borderColor: colors.border },
            ]}>
            <Text
              style={{ color: objetivo === valor ? colors.tintForeground : colors.text, fontWeight: '700', fontSize: 13 }}>
              {OBJETIVO_LABEL[valor]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={crear}
        disabled={!nombre.trim() || creando}
        style={[styles.boton, { backgroundColor: colors.tint, opacity: !nombre.trim() || creando ? 0.5 : 1 }]}>
        {creando ? (
          <ActivityIndicator color={colors.tintForeground} />
        ) : (
          <Text style={{ color: colors.tintForeground, fontWeight: '800', fontSize: 16 }}>Crear y agregar ejercicios</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: Spacing.four, paddingBottom: Spacing.six },
  titulo: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.one },
  etiqueta: { fontSize: 13, fontWeight: '700', marginTop: Spacing.three, marginBottom: Spacing.one },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 15 },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1 },
  boton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.five },
});
