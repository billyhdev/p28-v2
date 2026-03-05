import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TextStyle } from 'react-native';
import { colors, spacing, radius, typography, minTouchTarget } from '@/theme/tokens';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  containerStyle?: object;
  /** Optional style for the TextInput (e.g. extra padding for auth screens). */
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
        placeholderTextColor="#9DA3B3"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        minHeight={minTouchTarget}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
