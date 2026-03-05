import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/primitives';
import { colors, radius, spacing, typography, shadow } from '@/theme/tokens';

export interface AddSheetProps {
  visible: boolean;
  title: string;
  inputLabel: string;
  placeholder: string;
  saving?: boolean;
  onSave: (name: string) => void;
  onDismiss: () => void;
}

export function AddSheet({
  visible,
  title,
  inputLabel,
  placeholder,
  saving = false,
  onSave,
  onDismiss,
}: AddSheetProps) {
  const [value, setValue] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setValue('');
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 240, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>{title}</Text>

          <Text style={styles.inputLabel}>{inputLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9DA3B3"
            value={value}
            onChangeText={setValue}
            editable={!saving}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel={inputLabel}
          />

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleDismiss}
              variant="secondary"
              disabled={saving}
              style={styles.actionBtn}
              accessibilityLabel="Cancel"
            />
            <Button
              title={saving ? 'Saving…' : 'Save'}
              onPress={handleSave}
              variant="primary"
              disabled={!value.trim() || saving}
              style={styles.actionBtn}
              accessibilityLabel="Save"
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 16, 40, 0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: shadow.floating.shadowOffset,
    shadowOpacity: shadow.floating.shadowOpacity,
    shadowRadius: shadow.floating.shadowRadius,
    elevation: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink300,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.label,
    color: colors.ink700,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.surface100,
    paddingHorizontal: 14,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
