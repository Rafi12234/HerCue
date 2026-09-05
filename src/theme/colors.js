/**
 * HerCue palette — "a tiny private garden of care".
 *
 * Warm ivory paper, blush and dusty rose ink, and one gentle accent per care
 * category. Never import raw hex values anywhere else in the app.
 */

const palette = {
  // Surfaces — warm, papery, never pure white
  ivory: '#FFFBF7',
  cream: '#FFF6EF',
  paper: '#FFFFFF',
  shell: '#FDF2EC',
  mist: '#F6EFEA',

  // Ink
  cocoa: '#3F3235',
  clay: '#6E5C60',
  stone: '#9A8A8E',
  smoke: '#C4B6B9',
  hairline: '#F0E4E0',

  // Brand
  blush: '#E9A6B4',
  blushSoft: '#FBE7EB',
  blushDeep: '#D2788C',
  rose: '#D98CA0',
  lavender: '#B9A8DC',
  lavenderSoft: '#F0EBFA',

  // Category accents
  aqua: '#6FBCC9',
  aquaSoft: '#E2F3F5',
  aquaDeep: '#4B94A2',

  coral: '#E79C90',
  coralSoft: '#FCEAE6',
  coralDeep: '#C4756A',

  lilac: '#A99BD4',
  lilacSoft: '#EFEBFA',
  lilacDeep: '#8477B5',

  peach: '#EFAE86',
  peachSoft: '#FDEDE1',
  peachDeep: '#C9855D',

  petal: '#DE8FA6',
  petalSoft: '#FBE6EC',
  petalDeep: '#B96780',

  // Semantic status
  sage: '#7FB79A',
  sageSoft: '#E6F2EB',
  amber: '#E0AE6A',
  amberSoft: '#FBF0E0',
  ember: '#C97B77',
  emberSoft: '#FAE8E7',
};

export const colors = {
  ...palette,

  background: palette.ivory,
  backgroundAlt: palette.cream,
  surface: palette.paper,
  surfaceMuted: palette.shell,
  surfaceSunken: palette.mist,
  border: palette.hairline,

  textPrimary: palette.cocoa,
  textSecondary: palette.clay,
  textMuted: palette.stone,
  textFaint: palette.smoke,
  textOnAccent: '#FFFFFF',

  accent: palette.blush,
  accentSoft: palette.blushSoft,
  accentDeep: palette.blushDeep,
};

/**
 * One accent identity per care category. `tint` is for large soft fills,
 * `base` for icons and fills, `deep` for text that must stay readable.
 */
export const categoryColors = {
  WATER: {
    base: palette.aqua,
    tint: palette.aquaSoft,
    deep: palette.aquaDeep,
    glow: 'rgba(111, 188, 201, 0.22)',
  },
  MEDICINE: {
    base: palette.coral,
    tint: palette.coralSoft,
    deep: palette.coralDeep,
    glow: 'rgba(231, 156, 144, 0.22)',
  },
  BATHROOM: {
    base: palette.lilac,
    tint: palette.lilacSoft,
    deep: palette.lilacDeep,
    glow: 'rgba(169, 155, 212, 0.22)',
  },
  FOOD: {
    base: palette.peach,
    tint: palette.peachSoft,
    deep: palette.peachDeep,
    glow: 'rgba(239, 174, 134, 0.22)',
  },
  PERIOD: {
    base: palette.petal,
    tint: palette.petalSoft,
    deep: palette.petalDeep,
    glow: 'rgba(222, 143, 166, 0.22)',
  },
};

/** Status colour is always paired with an icon or label — never colour alone. */
export const statusColors = {
  PENDING: { base: palette.stone, tint: palette.mist, deep: palette.clay },
  TRIGGERED: { base: palette.blush, tint: palette.blushSoft, deep: palette.blushDeep },
  COMPLETED: { base: palette.sage, tint: palette.sageSoft, deep: '#4F8468' },
  SNOOZED: { base: palette.amber, tint: palette.amberSoft, deep: '#A97B3C' },
  SKIPPED: { base: palette.smoke, tint: palette.mist, deep: palette.clay },
  MISSED: { base: palette.ember, tint: palette.emberSoft, deep: '#A2564F' },
  CANCELLED: { base: palette.smoke, tint: palette.mist, deep: palette.stone },
};

export const gradients = {
  dawn: ['#FFF4EC', '#FFFBF7'],
  petal: ['#FDEDF1', '#FFF7F3'],
};
