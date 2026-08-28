import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function MenuRow({ icon, title, subtitle, onPress, danger = false }: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? colors.danger : colors.primary;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
        <MaterialCommunityIcons color={color} name={icon} size={22} />
      </View>
      <View style={styles.copy}>
        <ThemedText variant="bodyMedium" color={danger ? colors.danger : colors.text}>{title}</ThemedText>
        {subtitle ? <ThemedText variant="caption" color={colors.textMuted}>{subtitle}</ThemedText> : null}
      </View>
      <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={22} />
    </Pressable>
  );
}

const styles = {
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md } satisfies ViewStyle,
  pressed: { backgroundColor: colors.surfaceMuted } satisfies ViewStyle,
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' } satisfies ViewStyle,
  copy: { flex: 1, gap: spacing.xxs } satisfies ViewStyle,
};
