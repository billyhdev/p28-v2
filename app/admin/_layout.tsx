import { Stack } from 'expo-router';

import { t } from '@/lib/i18n';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('admin.title'), headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="[orgId]/index"
        options={{
          title: t('admin.editOrg'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="[orgId]/ministry/[ministryId]/index"
        options={{
          title: t('admin.ministries'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="[orgId]/ministry/[ministryId]/group/[groupId]"
        options={{
          title: t('admin.groupName'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
