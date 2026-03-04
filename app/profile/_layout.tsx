import { Stack } from 'expo-router';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';

export default function ProfileLayout() {
  useLocale(); // Re-render when locale changes so titles update
  return (
    <Stack>
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen
        name="notifications"
        options={{ title: t('profile.notificationPreferences'), headerShown: true }}
      />
      <Stack.Screen name="language" options={{ title: t('language.title'), headerShown: true }} />
      <Stack.Screen name="conduct" options={{ title: t('conduct.title'), headerShown: true }} />
    </Stack>
  );
}
