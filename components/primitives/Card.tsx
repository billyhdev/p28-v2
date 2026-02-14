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
    shadowColor: colors.shadow,
    shadowOffset: shadow.card.shadowOffset,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    elevation: 2,
  },
});
