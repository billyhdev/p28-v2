import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import { PendingSignUpProvider } from '@/contexts/PendingSignUpContext';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
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
    <AuthProvider>
      <PendingSignUpProvider>
        <LocaleProvider>
          <RootLayoutNav />
        </LocaleProvider>
      </PendingSignUpProvider>
    </AuthProvider>
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

  // Sync profile.preferredLanguage → locale only on initial auth load.
  // Do NOT depend on setLocale: it changes when locale changes, which would re-run
  // this effect and overwrite the user's in-progress language selection with stale profile data.
  useEffect(() => {
    if (isLoading) return;
    const userId = session?.user?.id;
    if (!userId) return;
    api.data.getProfile(userId).then((r) => {
      if ('userId' in r && r.preferredLanguage) {
        setLocaleRef.current(r.preferredLanguage);
      }
    });
  }, [session?.user?.id, isLoading]);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F5F8FC',
      card: '#FFFFFF',
      primary: '#6E9AC0',
      border: 'rgba(28, 28, 28, 0.06)',
      text: '#1C1C1C',
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            title: t('profile.editProfile'),
            headerBackButtonDisplayMode: 'minimal',
            headerTitleStyle: { fontWeight: '500', color: '#1C1C1C' },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
