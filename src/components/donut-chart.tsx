import { View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';

const palette = ['#0E5787', '#2E7D32', '#E98B2A', '#7B61A8', '#007A9E', '#C62828'];

export type DonutDatum = { name: string; value: number };

export function DonutChart({ data }: { data: DonutDatum[] }) {
  const size = 168;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const segments = data.map((item, index) => ({
    ...item,
    portion: total > 0 ? Math.max(0, item.value) / total : 0,
    offset: total > 0
      ? data.slice(0, index).reduce((sum, previous) => sum + Math.max(0, previous.value), 0) / total
      : 0,
    color: palette[index % palette.length],
  }));

  if (total <= 0) {
    return <ThemedText color={colors.textMuted}>Ainda não há despesas para mostrar.</ThemedText>;
  }

  return (
    <View
      accessible
      accessibilityLabel={`Distribuição de despesas. ${segments.map((item) => `${item.name}: ${Math.round(item.portion * 100)} por cento`).join(', ')}`}
      style={styles.wrapper}>
      <View style={styles.chart}>
        <Svg height={size} width={size}>
          <Circle cx={size / 2} cy={size / 2} fill="none" r={radius} stroke={colors.border} strokeWidth={stroke} />
          {segments.map((item) => (
            <Circle
              key={item.name}
              cx={size / 2}
              cy={size / 2}
              fill="none"
              origin={`${size / 2}, ${size / 2}`}
              r={radius}
              rotation={-90}
              stroke={item.color}
              strokeDasharray={`${item.portion * circumference} ${circumference}`}
              strokeDashoffset={-item.offset * circumference}
              strokeLinecap="butt"
              strokeWidth={stroke}
            />
          ))}
        </Svg>
        <View pointerEvents="none" style={styles.center}>
          <ThemedText variant="caption" color={colors.textMuted}>Total</ThemedText>
          <ThemedText variant="heading">100%</ThemedText>
        </View>
      </View>
      <View style={styles.legend}>
        {segments.map((item) => (
          <View key={item.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <ThemedText variant="caption" style={styles.legendLabel} numberOfLines={1}>{item.name}</ThemedText>
            <ThemedText variant="label">{Math.round(item.portion * 100)}%</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = {
  wrapper: { alignItems: 'center', gap: spacing.lg } satisfies ViewStyle,
  chart: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' } satisfies ViewStyle,
  center: { position: 'absolute', alignItems: 'center' } satisfies ViewStyle,
  legend: { alignSelf: 'stretch', gap: spacing.sm } satisfies ViewStyle,
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } satisfies ViewStyle,
  legendLabel: { flex: 1 } as const,
  dot: { width: 10, height: 10, borderRadius: 5 } satisfies ViewStyle,
};
