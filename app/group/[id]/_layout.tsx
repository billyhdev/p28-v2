import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

export default function GroupDetailStackLayout() {
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
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="index"
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
        name="super-admin"
        options={{
          title: t('groups.superAdminAssignTitle'),
        }}
      />
    </Stack>
  );
}
