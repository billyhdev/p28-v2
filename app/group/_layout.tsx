import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

export default function GroupLayout() {
  const router = useRouter();
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
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: '',
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
              accessibilityLabel={t('common.back')}
              accessibilityHint={t('groups.backToGroupsHint')}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={22} color="#ffffff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: t('groups.createGroup'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: t('groups.editGroup'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: t('groups.settingsTitle'),
        }}
      />
      <Stack.Screen
        name="discussion/[id]"
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="discussion/create"
        options={{
          title: t('discussions.createDiscussion'),
        }}
      />
      <Stack.Screen
        name="discussion/edit"
        options={{
          title: t('discussions.editDiscussion'),
        }}
      />
      <Stack.Screen
        name="members"
        options={{
          title: t('groups.people'),
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          title: t('groups.manageMyGroupsTitle'),
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
              accessibilityLabel={t('common.back')}
              accessibilityHint={t('groups.backToGroupsHint')}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
