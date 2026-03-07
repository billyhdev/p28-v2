import { Stack } from 'expo-router';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';

export default function NotificationsTabLayout() {
  useLocale();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="friend-requests"
        options={{
          headerShown: true,
          title: t('notifications.friendRequests'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
