import { ActivityIndicator, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { ThemedText } from './themed-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variants: Record<ButtonVariant, { backgroundColor: string; foregroundColor: string; borderColor: string }> = {
  primary: {
    backgroundColor: colors.primary,
    foregroundColor: colors.textOnPrimary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    foregroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.transparent,
    foregroundColor: colors.primary,
    borderColor: colors.transparent,
  },
  destructive: {
    backgroundColor: colors.danger,
    foregroundColor: colors.textOnPrimary,
    borderColor: colors.danger,
  },
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const palette = variants[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={inactive ? { disabled: true, ...(loading ? { busy: true } : {}) } : undefined}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: inactive ? 0.45 : pressed ? 0.78 : 1,
        },
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={palette.foregroundColor} />
      ) : (
        <ThemedText variant="label" color={palette.foregroundColor}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = {
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
} satisfies Record<string, ViewStyle>;
