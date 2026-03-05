import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadow } from '@/theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: shadow.cardSoft.shadowOffset,
    shadowOpacity: shadow.cardSoft.shadowOpacity,
    shadowRadius: shadow.cardSoft.shadowRadius,
    elevation: 2,
  },
});
