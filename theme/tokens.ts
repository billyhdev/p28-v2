/**
 * Design tokens — Calm & Glass (single source of truth).
 *
 * Aesthetic: Church platform invoking bliss and calm.
 * Palette: light pastel blue primary, glassmorphism surfaces, generous spacing.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Neutrals
  background: '#F5F8FC',
  surface: '#FFFFFF',
  surfaceHighlight: '#F8FAFD',
  surface100: '#EEF4FA',

  // Brand — pastel blue (bliss and calm, darkened for text contrast)
  primary: '#6E9AC0',
  primaryDark: '#5E8AB0',
  primaryLight: '#9BB8DC',
  onPrimary: '#FFFFFF',
  brandSoft: '#E8F0F8',

  // Accent aliases
  accent: '#6E9AC0',
  accentSoft: '#E8F0F8',
  lavender: '#6E9AC0',
  lavenderSoft: '#E8F0F8',
  blue: '#6E9AC0',
  blueSoft: '#E8F0F8',
  peach: '#E8D4C4',
  greenSoft: '#E4E8E5',
  amberSoft: '#EDE9E0',

  // Card backgrounds (unified)
  cardDefault: '#FFFFFF',
  cardAlt: '#F5F8FC',
  cardHighlight: '#F8FAFD',

  // Glassmorphism
  glass: {
    surface: 'rgba(255, 255, 255, 0.8)',
    surfaceStrong: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(255, 255, 255, 0.5)',
    borderSubtle: 'rgba(0, 0, 0, 0.04)',
  },

  // Text
  textPrimary: '#1C1C1C',
  textSecondary: '#5A5850',
  ink700: '#5A5850',
  ink300: '#B5B3AD',

  // Semantic (muted, desaturated)
  success: '#6A9A7B',
  warning: '#C09A5A',
  error: '#BF6060',
  info: '#6E9AC0',

  // Misc
  shadow: '#1C1C1C',
  borderSubtle: 'rgba(28, 28, 28, 0.06)',
  focusRing: 'rgba(110, 154, 192, 0.35)',
} as const;

// ---------------------------------------------------------------------------
// Spacing (generous for calm, blissful feel)
// ---------------------------------------------------------------------------

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  screenHorizontal: 20,
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 28,
} as const;

// ---------------------------------------------------------------------------
// Radius (larger for calm, rounded feel)
// ---------------------------------------------------------------------------

export const radius = {
  sm: 8,
  button: 12,
  card: 16,
  chip: 999,
  lg: 12,
  xl: 20,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typography = {
  h1: { fontSize: 32, fontWeight: '500' as const, letterSpacing: -0.3 },
  h2: { fontSize: 24, fontWeight: '500' as const, letterSpacing: -0.2 },
  h3: { fontSize: 20, fontWeight: '500' as const, letterSpacing: -0.1 },
  title: { fontSize: 18, fontWeight: '500' as const, letterSpacing: 0 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  bodyStrong: { fontSize: 15, fontWeight: '500' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.2 },
  buttonLabel: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0.3 },
  cardTitle: { fontSize: 16, fontWeight: '500' as const },
} as const;

// ---------------------------------------------------------------------------
// Shadow (soft for glassmorphism feel)
// ---------------------------------------------------------------------------

export const shadow = {
  cardSoft: {
    shadowOpacity: 0.04,
    shadowRadius: 24,
    shadowOffset: { width: 0 as const, height: 4 },
  },
  floating: {
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0 as const, height: 8 },
  },
  card: {
    shadowOpacity: 0.04,
    shadowRadius: 24,
    shadowOffset: { width: 0 as const, height: 4 },
  },
} as const;

// ---------------------------------------------------------------------------
// Avatar sizes
// ---------------------------------------------------------------------------

export const avatarSizes = { sm: 28, md: 36, lg: 48, xl: 72 } as const;

// ---------------------------------------------------------------------------
// Auth / form screens
// ---------------------------------------------------------------------------

export const minTouchTarget = 44;

export const authScreen = {
  inputStyle: { paddingHorizontal: 14, paddingVertical: 14, minHeight: 48 } as const,
  ctaMinHeight: 48,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

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
