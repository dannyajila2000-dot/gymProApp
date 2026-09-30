import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // El fondo blanco aplica siempre (sin importar el tema del celular), así que
  // la navegación también se fuerza siempre a DefaultTheme (claro).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <AnimatedSplashOverlay />
        <SessionProvider>
          <SplashAlIniciarSesion />
          <RootNavigator />
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Repite la bienvenida cuando el usuario inicia sesión (o se registra) con la
// app ya abierta. Al abrir la app con sesión guardada no aplica: ahí ya se
// mostró el splash inicial.
function SplashAlIniciarSesion() {
  const { cliente, isLoading } = useSesion();
  const [habiaSesion, setHabiaSesion] = useState<boolean | null>(null);
  const [vez, setVez] = useState(0);

  // Ajuste de estado durante el render (patrón oficial de React para reaccionar
  // a un cambio de valor sin useEffect).
  const haySesion = !!cliente;
  if (!isLoading && habiaSesion !== haySesion) {
    setHabiaSesion(haySesion);
    if (habiaSesion === false && haySesion) setVez((v) => v + 1);
  }

  return vez > 0 ? <AnimatedSplashOverlay key={vez} conSplashNativo={false} /> : null;
}

function RootNavigator() {
  const { cliente, isLoading } = useSesion();
  const colors = useTheme();

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!cliente && cliente.onboardingCompletado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entrenamiento/[rutinaId]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="rutinas/[rutinaId]" />
        <Stack.Screen name="rutinas/disenar" />
        <Stack.Screen name="rutinas/categorias" />
        <Stack.Screen name="rutinas/historial" />
        <Stack.Screen name="rutinas/mias/[rutinaId]" />
        <Stack.Screen name="ajustes" />
      </Stack.Protected>

      <Stack.Protected guard={!!cliente && !cliente.onboardingCompletado}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={!cliente}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
