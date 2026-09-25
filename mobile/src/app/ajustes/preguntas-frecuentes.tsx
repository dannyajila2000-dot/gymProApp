import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PREGUNTAS = [
  {
    pregunta: '¿Con qué frecuencia debería entrenar?',
    respuesta:
      'Depende de tu nivel: si eres principiante, 2-3 veces por semana está bien para empezar. Si ya tienes experiencia, puedes entrenar casi todos los días. Tu rutina ya viene ajustada a tu nivel de fitness.',
  },
  {
    pregunta: '¿Puedo cambiar mi rutina?',
    respuesta: 'Sí, en la pestaña Rutina puedes ver "Otras rutinas" y elegir la que prefieras en cualquier momento.',
  },
  {
    pregunta: '¿Cómo cambio mi restricción física o mi entrenador?',
    respuesta:
      'Ve a Perfil → Ajustes de entrenamiento. Ahí puedes cambiar si tienes alguna restricción física y si prefieres ver animación o video en los ejercicios.',
  },
  {
    pregunta: 'Los recordatorios no me llegan, ¿qué hago?',
    respuesta:
      'Revisa que le hayas dado permiso de notificaciones a la app desde los ajustes de tu celular. También puedes crear o revisar tus recordatorios en Perfil → Recordatorios.',
  },
  {
    pregunta: '¿Cómo cambio mi contraseña?',
    respuesta: 'Ve a Perfil → Mi perfil, baja hasta "Cambiar contraseña" y escribe tu contraseña actual y la nueva.',
  },
  {
    pregunta: 'Mi rutina ya no combina con mi objetivo actual',
    respuesta:
      'Registra tu peso (y si quieres, tu % de grasa corporal) en la pestaña Progreso, y luego toca "Recalcular mi rutina" — te asignaremos la que mejor combine con tus datos más recientes.',
  },
];

export default function PreguntasFrecuentes() {
  const colors = useTheme();
  const [abierta, setAbierta] = useState<number | null>(null);

  function alternar(indice: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAbierta((actual) => (actual === indice ? null : indice));
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.contenedor}>
      {PREGUNTAS.map((item, indice) => {
        const abiertaActual = abierta === indice;
        return (
          <Pressable
            key={item.pregunta}
            onPress={() => alternar(indice)}
            style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.filaPregunta}>
              <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{item.pregunta}</Text>
              <Ionicons
                name={abiertaActual ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            {abiertaActual && (
              <Text style={{ color: colors.textSecondary, marginTop: Spacing.two, lineHeight: 20 }}>
                {item.respuesta}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  tarjeta: { borderRadius: 16, padding: Spacing.three },
  filaPregunta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
