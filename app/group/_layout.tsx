import { Stack } from 'expo-router';

import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

export default function GroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          ...typography.title,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal' as const,
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: '' }} />
      <Stack.Screen
        name="create"
        options={{
          title: t('groups.createGroup'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
