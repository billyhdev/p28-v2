import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, typography, minTouchTarget } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Stretches the button to fill its container width */
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Optional style for the button container (e.g. alignSelf: 'stretch', minHeight for larger CTAs). */
  style?: ViewStyle;
}

const springConfig = { damping: 22, stiffness: 340 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style: styleProp,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const containerVariant =
    variant === 'primary'
      ? variantStyles.primaryContainer
      : variant === 'secondary'
        ? variantStyles.secondaryContainer
        : variantStyles.textContainer;

  const labelVariant =
    variant === 'primary'
      ? variantStyles.primaryLabel
      : variant === 'secondary'
        ? variantStyles.secondaryLabel
        : variantStyles.textLabel;

  return (
    <Animated.View
      style={[
        styles.base,
        containerVariant,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        styleProp,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          if (!disabled) scale.set(withSpring(0.97, springConfig));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, springConfig));
        }}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        <Text style={[styles.label, labelVariant]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    borderRadius: radius.button,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  pressable: {
    flexDirection: 'row',
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  fullWidth: { alignSelf: 'stretch' as const },
  label: {
    ...typography.buttonLabel,
  },
});

const variantStyles = StyleSheet.create({
  primaryContainer: { backgroundColor: colors.primary },
  primaryLabel: { color: colors.onPrimary },
  secondaryContainer: {
    backgroundColor: colors.secondaryContainer,
  },
  secondaryLabel: { color: colors.onSecondaryContainer },
  textContainer: { backgroundColor: 'transparent' },
  textLabel: { color: colors.primary },
});
