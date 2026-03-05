import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, typography, minTouchTarget } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Optional style for the button container (e.g. alignSelf: 'stretch', minHeight for larger CTAs). */
  style?: ViewStyle;
}

const springConfig = { damping: 18, stiffness: 320 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style: styleProp,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : styles.textVariant;

  return (
    <Animated.View
      style={[
        styles.base,
        variantStyle.container,
        disabled && styles.disabled,
        animatedStyle,
        styleProp,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          if (!disabled) scale.set(withSpring(0.98, springConfig));
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
        <Text style={[styles.label, variantStyle.label]}>{title}</Text>
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
  disabled: { opacity: 0.45 },
  label: {
    ...typography.buttonLabel,
  },
  primary: {
    container: { backgroundColor: colors.primary } as ViewStyle,
    label: { color: colors.surface } as TextStyle,
  },
  secondary: {
    container: { backgroundColor: colors.brandSoft } as ViewStyle,
    label: { color: colors.primary } as TextStyle,
  },
  textVariant: {
    container: { backgroundColor: 'transparent' } as ViewStyle,
    label: { color: colors.primary } as TextStyle,
  },
});
