import React from 'react';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/hooks/useAuth';
import { usePendingFriendRequestCountQuery } from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import { colors, typography, fontFamily } from '@/theme/tokens';

export default function TabLayout() {
  useLocale();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: pendingCount } = usePendingFriendRequestCountQuery(userId);
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.ink300,
        tabBarStyle: {},
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: fontFamily.serif,
          fontSize: 18,
          fontWeight: '400',
          color: colors.onSurface,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home'),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable
                accessibilityLabel={t('tabs.appInfo')}
                accessibilityHint={t('tabs.appInfoHint')}
              >
                {({ pressed }) => (
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color={colors.onSurfaceVariant}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarAccessibilityLabel: t('tabs.groups'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarAccessibilityLabel: t('tabs.messages'),
          lazy: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarAccessibilityLabel: t('tabs.notifications'),
          tabBarBadge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarAccessibilityLabel: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
