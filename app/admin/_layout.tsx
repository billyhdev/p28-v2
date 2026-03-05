import { Stack } from 'expo-router';

import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  headerTintColor: colors.primary,
};

export default function AdminLayout() {
  return (
    <Stack screenOptions={sharedHeaderOptions}>
      <Stack.Screen name="index" options={{ title: t('admin.title') }} />
      <Stack.Screen name="[orgId]/index" options={{ title: '' }} />
      <Stack.Screen name="[orgId]/ministry/[ministryId]/index" options={{ title: '' }} />
      <Stack.Screen
        name="[orgId]/ministry/[ministryId]/group/[groupId]"
        options={{ title: t('admin.editGroup') }}
      />
    </Stack>
  );
}
