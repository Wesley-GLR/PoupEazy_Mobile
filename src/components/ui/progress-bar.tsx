import { View, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'success' | 'danger' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const fillColor = tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={styles.track}>
      <View style={[styles.fill, { backgroundColor: fillColor, width: `${clamped}%` }]} />
    </View>
  );
}

const styles = {
  track: {
    height: 10,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: colors.border,
  } satisfies ViewStyle,
  fill: { height: '100%', borderRadius: radius.full } satisfies ViewStyle,
};
