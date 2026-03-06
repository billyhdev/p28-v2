/**
 * Design tokens — Minimal Monochrome (single source of truth).
 *
 * Aesthetic: Aesop / Kinfolk — calm, intentional, almost monochromatic.
 * Palette: warm off-whites, soft blacks, one accent: muted lavender-blue.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Neutrals
  background: '#F7F6F3',
  surface: '#FFFFFF',
  surfaceHighlight: '#EEEDEA',
  surface100: '#E8E7E4',

  // Brand / accent — muted lavender-blue
  primary: '#8B9BB8',
  primaryDark: '#7889A8',
  primaryLight: '#A8B4CC',
  brandSoft: '#E8EBF2',

  // Accent aliases (collapsed to monochrome palette)
  accent: '#8B9BB8',
  accentSoft: '#E8EBF2',
  lavender: '#8B9BB8',
  lavenderSoft: '#E8EBF2',
  blue: '#8B9BB8',
  blueSoft: '#E8EBF2',
  peach: '#C4B5A8',
  greenSoft: '#E4E8E5',
  amberSoft: '#EDE9E0',

  // Card backgrounds (unified)
  cardDefault: '#FFFFFF',
  cardAlt: '#F7F6F3',
  cardHighlight: '#F2F1EE',

  // Text
  textPrimary: '#1C1C1C',
  textSecondary: '#7A7770',
  ink700: '#5A5850',
  ink300: '#B5B3AD',

  // Semantic (muted, desaturated)
  success: '#6A9A7B',
  warning: '#C09A5A',
  error: '#BF6060',
  info: '#8B9BB8',

  // Misc
  shadow: '#1C1C1C',
  borderSubtle: 'rgba(28, 28, 28, 0.06)',
  focusRing: 'rgba(139, 155, 184, 0.30)',
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const spacing = {
  xxs: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screenHorizontal: 20,
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const radius = {
  sm: 4,
  button: 8,
  card: 12,
  chip: 999,
  lg: 8,
  xl: 16,
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
// Shadow
// ---------------------------------------------------------------------------

export const shadow = {
  cardSoft: {
    shadowOpacity: 0.03,
    shadowRadius: 24,
    shadowOffset: { width: 0 as const, height: 4 },
  },
  floating: {
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0 as const, height: 8 },
  },
  card: {
    shadowOpacity: 0.03,
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
