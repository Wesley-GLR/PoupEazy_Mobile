import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, spacing } from '@/theme';

type ScreenContainerProps = PropsWithChildren<
  ScrollViewProps & {
    contentStyle?: StyleProp<ViewStyle>;
    keyboardAware?: boolean;
  }
>;

export function ScreenContainer({
  children,
  contentStyle,
  keyboardAware = false,
  ...props
}: ScreenContainerProps) {
  const scrollView = (
    <ScrollView
      automaticallyAdjustKeyboardInsets={keyboardAware}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentStyle]}
      {...props}>
      {children}
    </ScrollView>
  );

  if (!keyboardAware) return scrollView;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}>
      {scrollView}
    </KeyboardAvoidingView>
  );
}

const styles = {
  keyboard: { flex: 1, backgroundColor: colors.background } satisfies ViewStyle,
  scroll: { flex: 1, backgroundColor: colors.background } satisfies ViewStyle,
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  } satisfies ViewStyle,
};
