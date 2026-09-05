import { colors } from './colors';

/**
 * Nunito (SIL Open Font License) is the single UI family — rounded and warm
 * without tipping into childish. Weights are limited to four on purpose.
 */
export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

/** Used until the bundled fonts finish loading, and if loading ever fails. */
export const fallbackFontFamily = {
  regular: undefined,
  medium: undefined,
  semibold: undefined,
  bold: undefined,
  extrabold: undefined,
};

export const typography = {
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: 15.5,
    lineHeight: 21,
    letterSpacing: -0.1,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
  overline: {
    fontFamily: fontFamily.bold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  metric: {
    fontFamily: fontFamily.extrabold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
    color: colors.textPrimary,
  },
  metricSmall: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  button: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: 0.1,
  },
};
