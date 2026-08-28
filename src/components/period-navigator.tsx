import { Pressable, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { usePeriod } from '@/state/period-context';

import { IconButton } from './icon-button';
import { ThemedText } from './ui';

export function PeriodNavigator() {
  const { label, previousMonth, nextMonth, goToCurrentMonth } = usePeriod();

  return (
    <View accessibilityLabel={`Período selecionado: ${label}`} style={styles.wrapper}>
      <IconButton icon="chevron-left" label="Mês anterior" onPress={previousMonth} />
      <Pressable accessibilityRole="button" onPress={goToCurrentMonth} style={styles.label}>
        <ThemedText variant="label" color={colors.primary} style={styles.center}>{label}</ThemedText>
        <ThemedText variant="caption" color={colors.textMuted}>Toque para voltar ao mês atual</ThemedText>
      </Pressable>
      <IconButton icon="chevron-right" label="Próximo mês" onPress={nextMonth} />
    </View>
  );
}

const styles = {
  wrapper: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.xs,
  } satisfies ViewStyle,
  label: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm } satisfies ViewStyle,
  center: { textAlign: 'center' as const },
};
