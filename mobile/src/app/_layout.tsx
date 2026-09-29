import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
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
          <RootNavigator />
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
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
        <Stack.Screen name="rutinas/nueva" />
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
