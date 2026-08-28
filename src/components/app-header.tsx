import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <ThemedText variant="title">{title}</ThemedText>
        {subtitle ? <ThemedText color={colors.textMuted}>{subtitle}</ThemedText> : null}
      </View>
      {action}
    </View>
  );
}

const styles = {
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  } satisfies ViewStyle,
  copy: { flex: 1, gap: spacing.xs } satisfies ViewStyle,
};
