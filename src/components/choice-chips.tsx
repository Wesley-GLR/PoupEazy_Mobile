import { Pressable, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type Choice<T extends string> = { label: string; value: T };

export function ChoiceChips<T extends string>({
  choices,
  value,
  onChange,
  label,
}: {
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.row}>
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(choice.value)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && { opacity: 0.78 },
            ]}>
            <ThemedText
              variant="label"
              color={selected ? colors.textOnPrimary : colors.textMuted}>
              {choice.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = {
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } satisfies ViewStyle,
  chip: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  } satisfies ViewStyle,
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary } satisfies ViewStyle,
};
