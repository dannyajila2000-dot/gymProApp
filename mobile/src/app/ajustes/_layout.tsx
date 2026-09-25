import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function AjustesLayout() {
  const colors = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: '',
      }}>
      <Stack.Screen name="perfil" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="entrenamiento" options={{ title: 'Ajustes de entrenamiento' }} />
      <Stack.Screen name="recordatorios" options={{ title: 'Recordatorios' }} />
    </Stack>
  );
}
