import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '@/theme/tokens';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'neutral';
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const containerStyle = variant === 'neutral' ? styles.neutralBg : styles.primaryBg;

  const textStyle = variant === 'neutral' ? styles.neutralText : styles.primaryText;

  return (
    <View style={[styles.badge, containerStyle]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
  },
  primaryBg: { backgroundColor: colors.brandSoft },
  primaryText: { color: colors.primary },
  neutralBg: { backgroundColor: colors.surfaceHighlight },
  neutralText: { color: colors.ink700 },
});
