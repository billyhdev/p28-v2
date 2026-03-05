/**
 * Design tokens — Pastel Productivity (single source of truth).
 * Values derived from design.tokens.json / design.json.
 *
 * Backward-compatible key names kept so all existing imports continue working.
 * New token keys have been added without removing existing ones.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Neutrals
  background: '#F4F1FC',       // slightly lavender-tinted screen background (toward gradient start)
  gradientStart: '#F1ECFF',    // screen gradient start (lavender)
  gradientEnd: '#EFF3FA',      // screen gradient end (cool gray)
  surface: '#FFFFFF',           // surface0 — card / panel surface
  surfaceHighlight: '#EEF1F8', // surfaceTint — pressed state, input border
  surface100: '#F1F3F8',       // slightly darker tint

  // Brand
  primary: '#4B3A8A',          // brandPrimary — CTAs, active icons, links
  primaryDark: '#3F2E80',      // brandPrimaryDark — FAB, pressed primary
  primaryLight: '#8F7CD8',     // brandLight
  brandSoft: '#E9E2FF',        // brandSoft — secondary button bg, badge bg

  // Accents
  accent: '#EA8E78',           // coral — accent / warm highlight
  accentSoft: '#FBE3DC',       // coralSoft
  lavender: '#A286F3',
  lavenderSoft: '#EDE6FF',
  blue: '#6AAEE6',
  blueSoft: '#DCEEFF',
  peach: '#F2B5A1',
  greenSoft: '#DDF4E8',
  amberSoft: '#FFF2CF',

  // Card backgrounds
  cardDefault: '#F4F7FD',
  cardAlt: '#FCE9E6',
  cardHighlight: '#E9F1FF',

  // Text
  textPrimary: '#1F2130',      // ink900
  textSecondary: '#7D8193',    // ink500 (was rgba; now solid for legibility)
  ink700: '#4D5060',
  ink300: '#B8BDCB',

  // Semantic
  success: '#3AA76D',
  warning: '#D08B34',
  error: '#D95858',
  info: '#4D8FD9',

  // Misc
  shadow: '#1A1530',           // slightly purple-tinted shadow base
  borderSubtle: 'rgba(30, 27, 45, 0.08)',
  focusRing: 'rgba(75, 58, 138, 0.35)',
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const spacing = {
  xxs: 4,
  xs: 4,               // kept as 4 for backward-compat (original xs)
  sm: 8,               // kept as 8
  md: 16,              // kept as 16
  lg: 24,              // kept as 24 (original lg — many screens rely on this)
  xl: 32,              // kept as 32
  /** Horizontal padding for screen content */
  screenHorizontal: 20,
  /** Padding inside cards */
  cardPadding: 16,
  /** Gap between cards / sections */
  cardGap: 12,
  /** Section gap */
  sectionGap: 24,
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const radius = {
  sm: 10,
  button: 14,   // was 12 → rounder buttons
  card: 20,     // was 16 → rounder cards
  chip: 999,    // pill shape for chips/badges
  lg: 18,
  xl: 24,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typography = {
  // Screen-level titles
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.2 },
  h2: { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.2 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  title: { fontSize: 18, fontWeight: '600' as const },

  // Body copy
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },

  // Labels & small
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  label: { fontSize: 13, fontWeight: '500' as const },

  // Buttons
  buttonLabel: { fontSize: 15, fontWeight: '600' as const },

  // Card titles (kept for backward-compat)
  cardTitle: { fontSize: 16, fontWeight: '600' as const },
} as const;

// ---------------------------------------------------------------------------
// Shadow
// ---------------------------------------------------------------------------

export const shadow = {
  /** Soft card shadow */
  cardSoft: {
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0 as const, height: 6 },
  },
  /** Floating element shadow (tab bar, FAB) */
  floating: {
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0 as const, height: 10 },
  },
  /** Backward-compat alias — use cardSoft in new code */
  card: {
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0 as const, height: 6 },
  },
} as const;

// ---------------------------------------------------------------------------
// Avatar sizes
// ---------------------------------------------------------------------------

export const avatarSizes = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 72,
} as const;

// ---------------------------------------------------------------------------
// Auth / form screens
// ---------------------------------------------------------------------------

export const minTouchTarget = 44;

export const authScreen = {
  inputStyle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  } as const,
  ctaMinHeight: 46,
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
