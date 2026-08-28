import { View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { ThemedText } from './themed-text';

type BadgeTone = 'neutral' | 'success' | 'danger' | 'info' | 'warning';

const tones: Record<BadgeTone, { background: string; foreground: string }> = {
  neutral: { background: colors.surfaceMuted, foreground: colors.textMuted },
  success: { background: colors.successSoft, foreground: colors.success },
  danger: { background: colors.dangerSoft, foreground: colors.danger },
  info: { background: colors.infoSoft, foreground: colors.info },
  warning: { background: colors.warningSoft, foreground: colors.warning },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <ThemedText variant="caption" color={palette.foreground}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = {
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  } satisfies ViewStyle,
};
