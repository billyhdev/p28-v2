import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, shadow, typography } from '@/theme/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 };

const springConfig = { damping: 22, stiffness: 340 };

function TabItem({
  label,
  iconFocused,
  iconDefault,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  label: string;
  iconFocused: IoniconsName;
  iconDefault: IoniconsName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => scale.set(withSpring(0.92, springConfig))}
        onPressOut={() => scale.set(withSpring(1, springConfig))}
        hitSlop={TAB_HIT_SLOP}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={accessibilityLabel ?? label}
        style={styles.tabPressable}
      >
        <Ionicons
          name={isFocused ? iconFocused : iconDefault}
          size={20}
          color={isFocused ? colors.textPrimary : colors.ink300}
        />
        <Text
          style={[styles.tabLabel, { color: isFocused ? colors.textPrimary : colors.ink300 }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const ICON_MAP: Record<string, { focused: IoniconsName; default: IoniconsName }> = {
  index: { focused: 'home', default: 'home-outline' },
  groups: { focused: 'people', default: 'people-outline' },
  messages: { focused: 'chatbubbles', default: 'chatbubbles-outline' },
  profile: { focused: 'person', default: 'person-outline' },
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const isFocused = state.index === index;
          const icons = ICON_MAP[route.name] ?? {
            focused: 'ellipse' as IoniconsName,
            default: 'ellipse-outline' as IoniconsName,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              iconFocused={icons.focused}
              iconDefault={icons.default}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: shadow.floating.shadowOffset,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tabPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
