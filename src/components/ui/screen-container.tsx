import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type ScreenContainerProps = PropsWithChildren<
  ScrollViewProps & {
    contentStyle?: StyleProp<ViewStyle>;
    keyboardAware?: boolean;
    /** Screens without a navigation header draw under the status bar. */
    withTopInset?: boolean;
  }
>;

export function ScreenContainer({
  children,
  contentStyle,
  keyboardAware = false,
  withTopInset = false,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const edgeInsets = {
    paddingTop: (withTopInset ? insets.top : 0) + spacing.lg,
    paddingBottom: insets.bottom + spacing.xxxl,
  };

  const scrollView = (
    <ScrollView
      automaticallyAdjustKeyboardInsets={keyboardAware}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={[styles.content, edgeInsets, contentStyle]}
      {...props}>
      {children}
    </ScrollView>
  );

  if (!keyboardAware) return scrollView;

  // Android is edge-to-edge from SDK 54 on, so the window no longer resizes for
  // the keyboard and the inputs need an explicit height reduction to stay visible.
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
    gap: spacing.lg,
  } satisfies ViewStyle,
};
