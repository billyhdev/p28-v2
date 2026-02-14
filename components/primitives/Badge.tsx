import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'neutral';
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
        ? colors.accent
        : colors.surfaceHighlight;
  const textColor = variant === 'neutral' ? colors.textPrimary : colors.surface;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.chip,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
