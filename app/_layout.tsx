import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import { PendingSignUpProvider } from '@/contexts/PendingSignUpContext';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    const authScreen = inAuthGroup ? segments[1] : null;
    if (!session && !inAuthGroup) {
      router.replace('/auth/sign-in');
    } else if (session && authScreen === 'sign-in') {
      // Session exists but user is on sign-in (e.g. back button); send to app. Do not redirect when on sign-up or onboarding so step 2 stays connected.
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  useEffect(() => {
    if (isLoading) return;
    const userId = session?.user?.id;
    if (!userId) return;
    api.data.getProfile(userId).then((r) => {
      if ('userId' in r && r.preferredLanguage) {
        setLocale(r.preferredLanguage);
      }
    });
  }, [session?.user?.id, isLoading, setLocale]);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F8F9FC',
      card: '#FFFFFF',
      primary: '#4B3A8A',
      border: 'rgba(30, 27, 45, 0.08)',
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
            headerTitleStyle: { fontWeight: '600', color: '#1F2130' },
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: true,
            title: t('admin.title'),
            headerBackButtonDisplayMode: 'minimal',
            headerTitleStyle: { fontWeight: '600', color: '#1F2130' },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
