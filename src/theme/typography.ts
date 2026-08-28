import type { TextStyle } from 'react-native';

export const fontFamily = {
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  heading: 'Roboto_700Bold',
  headingMedium: 'Roboto_500Medium',
} as const;

export const typography = {
  largeTitle: { fontFamily: fontFamily.heading, fontSize: 32, lineHeight: 38 } satisfies TextStyle,
  title: { fontFamily: fontFamily.heading, fontSize: 24, lineHeight: 30 } satisfies TextStyle,
  heading: { fontFamily: fontFamily.bodySemibold, fontSize: 18, lineHeight: 24 } satisfies TextStyle,
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  bodyMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  label: { fontFamily: fontFamily.bodySemibold, fontSize: 14, lineHeight: 20 } satisfies TextStyle,
  caption: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 16 } satisfies TextStyle,
  money: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
