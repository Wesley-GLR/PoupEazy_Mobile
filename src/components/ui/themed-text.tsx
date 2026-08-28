import type { PropsWithChildren } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme';

type ThemedTextProps = PropsWithChildren<
  TextProps & {
    variant?: TypographyVariant;
    color?: TextStyle['color'];
  }
>;

export function ThemedText({
  variant = 'body',
  color = colors.text,
  selectable,
  style,
  children,
  ...props
}: ThemedTextProps) {
  return (
    <Text
      selectable={selectable ?? false}
      style={[typography[variant], { color }, style]}
      {...props}>
      {children}
    </Text>
  );
}
