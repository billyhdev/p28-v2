import React from 'react';
import { Platform, View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, shadow } from '@/theme/tokens';

export type CardVariant = 'solid' | 'glass';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  /** Overlay padding for glass variant. Use 0 for full-bleed content (e.g. edge-to-edge images). */
  contentPadding?: number;
}

export function Card({
  children,
  variant = 'solid',
  style,
  contentPadding = spacing.cardPadding,
}: CardProps) {
  if (variant === 'glass') {
    return (
      <View style={[styles.card, styles.cardGlass, style]} collapsable={false}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          intensity={Platform.OS === 'ios' ? 60 : 70}
        />
        <View
          style={[
            styles.cardGlassOverlay,
            { padding: contentPadding },
            contentPadding === 0 && styles.cardGlassOverlayFullBleed,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }
  return <View style={[styles.card, styles.cardSolid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: shadow.cardSoft.shadowOffset,
    shadowOpacity: shadow.cardSoft.shadowOpacity,
    shadowRadius: shadow.cardSoft.shadowRadius,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardSolid: {
    backgroundColor: colors.surface,
  },
  cardGlass: {
    overflow: 'hidden',
    borderColor: colors.glass.border,
  },
  cardGlassOverlay: {
    backgroundColor: colors.glass.surface,
    borderRadius: radius.card,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  cardGlassOverlayFullBleed: {
    borderWidth: 0,
  },
});
