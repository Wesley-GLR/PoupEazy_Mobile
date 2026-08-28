import { forwardRef, useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme';

import { ThemedText } from './themed-text';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helperText, secureTextEntry, autoCapitalize = 'none', style, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <ThemedText variant="label" color={colors.textDark}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputShell,
          { borderColor: error ? colors.danger : focused ? colors.primary : colors.borderStrong },
        ]}>
        <TextInput
          ref={ref}
          {...props}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          secureTextEntry={isPassword ? !passwordVisible : undefined}
          style={[styles.input, style]}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={8}
            onPress={() => setPasswordVisible((value) => !value)}
            style={styles.visibilityButton}>
            <ThemedText variant="caption" color={colors.primary}>
              {passwordVisible ? 'Ocultar' : 'Mostrar'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {error || helperText ? (
        <ThemedText
          accessibilityLiveRegion="polite"
          selectable
          variant="caption"
          color={error ? colors.danger : colors.textMuted}>
          {error ?? helperText}
        </ThemedText>
      ) : null}
    </View>
  );
});

const styles = {
  wrapper: { gap: spacing.sm } satisfies ViewStyle,
  inputShell: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  } satisfies ViewStyle,
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fontFamily.body,
    fontSize: 16,
  } satisfies TextStyle,
  visibilityButton: {
    minWidth: 64,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  } satisfies ViewStyle,
};
