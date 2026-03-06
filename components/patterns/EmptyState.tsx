import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/primitives';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export interface EmptyStateProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ iconName, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={32} color={colors.ink300} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.action}
          accessibilityLabel={actionLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  action: {
    marginTop: spacing.sm,
  },
});
