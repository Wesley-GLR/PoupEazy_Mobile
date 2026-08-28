import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, type ViewStyle } from 'react-native';

import { Card, ThemedText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function SummaryCard({
  label,
  value,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: 'primary' | 'success' | 'danger' | 'info';
}) {
  const color = colors[tone];
  const soft = colors[`${tone}Soft` as const];
  return (
    <Card accessibilityLabel={`${label}: ${value}`} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: soft }]}>
        <MaterialCommunityIcons color={color} name={icon} size={22} />
      </View>
      <ThemedText variant="caption" color={colors.textMuted}>{label}</ThemedText>
      <ThemedText variant="money" color={color} numberOfLines={1} adjustsFontSizeToFit>{value}</ThemedText>
    </Card>
  );
}

const styles = {
  card: { flex: 1, minWidth: 148, gap: spacing.sm } satisfies ViewStyle,
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
};
