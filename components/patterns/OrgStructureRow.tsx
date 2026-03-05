import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export type OrgStructureType = 'org' | 'ministry' | 'group';

export interface OrgStructureRowProps {
  name: string;
  type: OrgStructureType;
  subtitle?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const TYPE_CONFIG: Record<
  OrgStructureType,
  {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconColor: string;
    iconBg: string;
    rowBg: string;
    label: string;
  }
> = {
  org: {
    icon: 'business-outline',
    iconColor: colors.primary,
    iconBg: colors.brandSoft,
    rowBg: colors.cardHighlight,
    label: 'Organization',
  },
  ministry: {
    icon: 'compass-outline',
    iconColor: '#7B5FD4',
    iconBg: colors.lavenderSoft,
    rowBg: colors.lavenderSoft,
    label: 'Ministry',
  },
  group: {
    icon: 'people-outline',
    iconColor: '#2E8B5A',
    iconBg: colors.greenSoft,
    rowBg: colors.greenSoft,
    label: 'Group',
  },
};

const springConfig = { damping: 20, stiffness: 300 };

export function OrgStructureRow({
  name,
  type,
  subtitle,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: OrgStructureRowProps) {
  const config = TYPE_CONFIG[type];
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={[styles.wrapper, { backgroundColor: config.rowBg }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.98, springConfig))}
        onPressOut={() => scale.set(withSpring(1, springConfig))}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? name}
        accessibilityHint={accessibilityHint ?? `Opens ${config.label.toLowerCase()} details`}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={20} color={config.iconColor} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            <Text style={styles.typeLabel}>{config.label}</Text>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={colors.ink300} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: shadow.cardSoft.shadowOffset,
    shadowOpacity: shadow.cardSoft.shadowOpacity,
    shadowRadius: shadow.cardSoft.shadowRadius,
    elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  typeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
