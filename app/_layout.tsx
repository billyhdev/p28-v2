import FontAwesome from '@expo/vector-icons/FontAwesome';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  NotoSerif_400Regular,
  NotoSerif_400Regular_Italic,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import { PendingSignUpProvider } from '@/contexts/PendingSignUpContext';
import { useAuth } from '@/hooks/useAuth';
import { useProfileQuery } from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import { colors, fontFamily } from '@/theme/tokens';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    // Editorial fonts — Noto Serif (headlines) + Plus Jakarta Sans (body)
    [fontFamily.serif]: NotoSerif_400Regular,
    [fontFamily.serifItalic]: NotoSerif_400Regular_Italic,
    [fontFamily.serifBold]: NotoSerif_700Bold,
    [fontFamily.sans]: PlusJakartaSans_400Regular,
    [fontFamily.sansMedium]: PlusJakartaSans_500Medium,
    [fontFamily.sansSemiBold]: PlusJakartaSans_600SemiBold,
    [fontFamily.sansBold]: PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PendingSignUpProvider>
          <LocaleProvider>
            <RootLayoutNav />
          </LocaleProvider>
        </PendingSignUpProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const { setLocale } = useLocale();
  const setLocaleRef = useRef(setLocale);
  setLocaleRef.current = setLocale;
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    const authScreen = inAuthGroup ? segments[1] : null;
    if (!session && !inAuthGroup) {
      router.replace('/auth/sign-in');
    } else if (session && authScreen === 'sign-in') {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, router]);

  const { data: profile } = useProfileQuery(session?.user?.id, {
    enabled: !isLoading && !!session?.user?.id,
  });

  useEffect(() => {
    if (!profile?.preferredLanguage) return;
    setLocaleRef.current(profile.preferredLanguage);
  }, [profile?.preferredLanguage]);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.surface,
      card: colors.surfaceContainerLowest,
      primary: colors.primary,
      border: colors.ghostBorder,
      text: colors.onSurface,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="group" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            title: t('profile.title'),
            headerBackButtonDisplayMode: 'minimal',
            headerTitleStyle: { fontFamily: fontFamily.serif, fontWeight: '400', color: colors.onSurface },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
