import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

/**
 * Native stack back can fail or feel flaky after routes where the parent stack
 * hides the header (e.g. group/[id]). Use explicit navigation like group/manage
 * and group/event/[id]/_layout.
 */
function GroupStackHeaderBack() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
      accessibilityLabel={t('common.back')}
      accessibilityHint={t('groups.backToGroupsHint')}
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={22} color={colors.primary} />
    </Pressable>
  );
}

const groupStackBackHeader = {
  headerLeft: () => <GroupStackHeaderBack />,
} as const;

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
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
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
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="discussion/[id]"
        options={{
          title: '',
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="discussion/create"
        options={{
          title: t('discussions.createDiscussion'),
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="discussion/edit"
        options={{
          title: t('discussions.editDiscussion'),
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="members"
        options={{
          title: t('groups.people'),
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="announcement/create"
        options={{
          title: t('announcements.screenTitle'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="announcement/list"
        options={{
          title: t('announcements.listTitle'),
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="announcement/[id]"
        options={{
          title: t('announcements.detailTitle'),
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="event/list"
        options={{
          title: t('groupEvents.listTitle'),
          ...groupStackBackHeader,
        }}
      />
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          title: t('groups.manageMyGroupsTitle'),
          ...groupStackBackHeader,
        }}
      />
    </Stack>
  );
}
