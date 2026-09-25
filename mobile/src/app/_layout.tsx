import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSesion } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
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
