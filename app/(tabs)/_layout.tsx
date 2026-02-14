import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarAllowFontScaling: true,
        tabBarLabelStyle: { marginTop: 8, marginBottom: 4 },
        tabBarStyle: { minHeight: 88, paddingTop: 20, paddingBottom: 32 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          tabBarAccessibilityLabel: 'Home',
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable
                accessibilityLabel="App info"
                accessibilityHint="Opens app information modal"
              >
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors.text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
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
          title: 'Groups',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          tabBarAccessibilityLabel: 'Groups',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
          tabBarAccessibilityLabel: 'Messages',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
