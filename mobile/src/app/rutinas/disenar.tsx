import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as rutinasApi from '@/api/rutinas';
import type { Rutina } from '@/api/rutinas';
import { RutinaImagen } from '@/components/rutinas/tarjetas-rutina';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const NOMBRE_NUEVA = 'Nuevo entrenamiento';

export default function DisenarEntrenamientos() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);

  useFocusEffect(
    useCallback(() => {
      rutinasApi
        .misRutinasPersonales()
        .then(setRutinas)
        .finally(() => setCargando(false));
    }, []),
  );

  // "Nuevo entrenamiento", "Nuevo entrenamiento 2", ... para no repetir nombre.
  function siguienteNombre() {
    const usados = rutinas.filter((r) => r.nombre.startsWith(NOMBRE_NUEVA)).length;
    return usados === 0 ? NOMBRE_NUEVA : `${NOMBRE_NUEVA} ${usados + 1}`;
  }

  async function crear() {
    if (creando) return;
    setCreando(true);
    try {
      const rutina = await rutinasApi.crearRutinaPersonal({
        nombre: siguienteNombre(),
        nivel: 'intermedio',
        objetivo: 'cuerpo_completo',
      });
      router.push({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: rutina.id } });
    } catch {
      Alert.alert('No se pudo crear', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setCreando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundElement }}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.titulo, { color: colors.text }]}>Diseña entrenamientos</Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={colors.tint} size="large" style={{ marginTop: Spacing.five }} />
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {rutinas.map((rutina) => (
            <Pressable
              key={rutina.id}
              onPress={() => router.push({ pathname: '/rutinas/mias/[rutinaId]', params: { rutinaId: rutina.id } })}
              style={[styles.tarjeta, { backgroundColor: colors.background }]}>
              <RutinaImagen rutina={rutina} style={styles.miniatura} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={2}>
                  {rutina.nombre}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>
                  {rutina.ejercicios.length} ejercicio{rutina.ejercicios.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
          {rutinas.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.six }}>
              Aún no has creado entrenamientos. Toca + para diseñar el primero.
            </Text>
          )}
        </ScrollView>
      )}

      <Pressable
        onPress={crear}
        disabled={creando}
        style={[styles.botonFlotante, { backgroundColor: colors.tint }]}
        accessibilityLabel="Crear entrenamiento">
        {creando ? (
          <ActivityIndicator color={colors.tintForeground} />
        ) : (
          <Ionicons name="add" size={34} color={colors.tintForeground} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  titulo: { fontSize: 22, fontWeight: '800' },
  lista: { paddingHorizontal: Spacing.four, paddingBottom: 120, gap: Spacing.three },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 28,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  miniatura: { width: 64, height: 64, borderRadius: 14 },
  nombre: { fontSize: 20, fontWeight: '800' },
  botonFlotante: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.five,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
