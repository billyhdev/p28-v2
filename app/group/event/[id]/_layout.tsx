import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

/**
 * First screen of this nested stack: native header omits back even when the group
 * stack has history. Match group/manage and parent screens that use router.back().
 */
function EventDetailBackButton() {
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

export default function GroupEventDetailLayout() {
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
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('groupEvents.eventTitle'),
          headerLeft: () => <EventDetailBackButton />,
        }}
      />
      <Stack.Screen name="attendees" options={{ title: t('groupEvents.attendeesTitle') }} />
    </Stack>
  );
}
