import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, Platform } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';
import { colors, shadow } from '@/theme/tokens';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  useLocale(); // Re-render when locale changes so tab labels update
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#A2A7B8',
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: '#F8F9FC',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.textPrimary,
          fontSize: 17,
        },
        headerShadowVisible: false,
        tabBarAllowFontScaling: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 68,
          paddingTop: 8,
          paddingHorizontal: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          // Floating card shadow
          shadowColor: colors.shadow,
          shadowOffset: shadow.floating.shadowOffset,
          shadowOpacity: shadow.floating.shadowOpacity,
          shadowRadius: shadow.floating.shadowRadius,
          elevation: 8,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          tabBarAccessibilityLabel: t('tabs.home'),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable
                accessibilityLabel={t('tabs.appInfo')}
                accessibilityHint={t('tabs.appInfoHint')}
              >
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={22}
                    color={colors.ink700}
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
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          tabBarAccessibilityLabel: t('tabs.groups'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
          tabBarAccessibilityLabel: t('tabs.messages'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          tabBarAccessibilityLabel: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
