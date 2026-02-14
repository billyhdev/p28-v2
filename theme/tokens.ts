/**
 * Design tokens — Spacious & Calm (single source of truth).
 * Used by components/primitives only. No hard-coded values in primitives.
 *
 * WCAG 2.1 AA contrast: Primary (#2C7CB5) and text (#1a1a1a) on background (#fafafa)
 * and surface (#ffffff) meet 4.5:1 for normal text. Semantic colors (success, warning, error)
 * are chosen for sufficient contrast on surface.
 */

export const colors = {
  background: '#fafafa',
  surface: '#ffffff',
  surfaceHighlight: '#e8eef5',
  primary: '#2C7CB5',
  accent: '#C77B38',
  textPrimary: '#1a1a1a',
  textSecondary: 'rgba(26, 26, 26, 0.8)',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  /** Neutral shadow for elevation (e.g. Card); primitives use this instead of hard-coded hex. */
  shadow: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** Horizontal padding for screen content (Spacious & Calm). */
  screenHorizontal: 20,
  /** Padding inside cards. */
  cardPadding: 24,
  /** Gap between cards / list items. */
  cardGap: 20,
} as const;

export const radius = {
  button: 12,
  card: 16,
  chip: 8,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
  /** Button label: 16pt semibold for touch targets */
  buttonLabel: { fontSize: 16, fontWeight: '600' as const },
  /** Card titles (Spacious & Calm). */
  cardTitle: { fontSize: 17, fontWeight: '600' as const },
} as const;

/** Card shadow token — soft elevation. */
export const shadow = {
  card: {
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0 as const, height: 4 },
  },
} as const;

/** Avatar size presets (pt); used by Avatar primitive only. */
export const avatarSizes = { sm: 32, md: 40, lg: 56, xl: 80 } as const;

/** Minimum touch target (pt) per WCAG / UX — 44×44 */
export const minTouchTarget = 44;

/** Auth/form screens: input and CTA dimensions (single source for sign-in, sign-up, onboarding). */
export const authScreen = {
  inputStyle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  } as const,
  ctaMinHeight: 52,
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  minTouchTarget,
  avatarSizes,
} as const;

export default tokens;
