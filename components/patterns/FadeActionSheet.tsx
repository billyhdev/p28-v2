import React from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useFadeSheetAnimation } from '@/hooks/useFadeSheetAnimation';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export interface FadeActionSheetOption {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface FadeActionSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  options: FadeActionSheetOption[];
}

export function FadeActionSheet({ visible, onRequestClose, options }: FadeActionSheetProps) {
  const { sheetSlideAnim, sheetFadeAnim } = useFadeSheetAnimation(visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onRequestClose}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: sheetFadeAnim }]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetSlideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetInner}>
            <View style={styles.handle} />
            {options.map((opt, idx) => (
              <Pressable
                key={idx}
                style={[styles.option, opt.destructive && styles.optionDestructive]}
                onPress={() => {
                  onRequestClose();
                  opt.onPress();
                }}
                accessibilityLabel={opt.accessibilityLabel ?? opt.label}
                accessibilityHint={opt.accessibilityHint}
                accessibilityRole="button"
              >
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={opt.destructive ? colors.error : colors.textPrimary}
                />
                <Text style={[styles.optionText, opt.destructive && styles.optionTextDestructive]}>
                  {opt.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.ink300} />
              </Pressable>
            ))}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(28, 28, 28, 0.3)',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: shadow.floating.shadowOffset,
    shadowOpacity: shadow.floating.shadowOpacity,
    shadowRadius: shadow.floating.shadowRadius,
    elevation: 12,
  },
  sheetInner: {},
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink300,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionDestructive: {},
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextDestructive: {
    color: colors.error,
  },
});
