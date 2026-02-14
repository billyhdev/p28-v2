import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, minTouchTarget } from '@/theme/tokens';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ListItem({
  title,
  subtitle,
  onPress,
  left,
  right,
  accessibilityLabel,
  accessibilityHint,
}: ListItemProps) {
  const content = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, styles.tappable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tappable: {
    minHeight: minTouchTarget,
  },
  pressed: { backgroundColor: colors.surfaceHighlight, opacity: 0.9 },
  left: { marginRight: spacing.sm },
  textWrap: { flex: 1 },
  title: {
    ...typography.body,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  right: { marginLeft: spacing.sm },
});
