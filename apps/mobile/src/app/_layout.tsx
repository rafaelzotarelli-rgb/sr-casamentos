import { Fraunces_600SemiBold, useFonts as useFraunces } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

// Telas abertas sem login. Todas as outras voltam ao login quando a sessão acaba
// (sair, sair de todos os aparelhos, sessão expirada).
const PUBLIC_ROUTES = new Set(['entrar', 'convite']);

function RootStack() {
  const { loading, session } = useAuth();
  const segments = useSegments();
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_600SemiBold });
  const ready = frauncesLoaded && interLoaded && !loading;
  const firstSegment = segments[0] ?? '';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (ready && !session && firstSegment && !PUBLIC_ROUTES.has(firstSegment)) {
      router.replace('/entrar');
    }
  }, [ready, session, firstSegment]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="conta" options={{ headerShown: true, title: 'Minha conta' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
