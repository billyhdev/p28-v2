/**
 * Shared styles for auth/form screens (sign-in, sign-up, onboarding).
 * Single source for layout and typography; screens only add screen-specific styles when needed.
 */
import { StyleSheet } from 'react-native';
import { colors, spacing, typography, authScreen } from '@/theme/tokens';

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  centeredBlock: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl * 1.5,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
    opacity: 0.85,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl * 1.5,
  },
  inputSpacing: {
    marginBottom: spacing.lg,
  },
  ctaButton: {
    alignSelf: 'stretch',
    minHeight: authScreen.ctaMinHeight,
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  secondaryCtaButton: {
    alignSelf: 'center',
    minHeight: authScreen.ctaMinHeight,
    paddingHorizontal: spacing.lg,
  },
});

export { authScreen };
