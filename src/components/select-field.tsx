import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/theme';

export type SelectOption = { label: string; value: string; detail?: string };

export function SelectField({ label, value, options, onChange, placeholder = 'Selecione…', error }: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrapper}>
      <ThemedText variant="label" color={colors.textDark}>{label}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, error && styles.fieldError, pressed && { opacity: 0.78 }]}>
        <ThemedText color={selected ? colors.text : colors.textMuted} style={styles.value}>{selected?.label ?? placeholder}</ThemedText>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-down" size={22} />
      </Pressable>
      {error ? <ThemedText variant="caption" color={colors.danger}>{error}</ThemedText> : null}
      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable accessibilityLabel="Fechar seleção" onPress={() => setOpen(false)} style={styles.overlay}>
          <SafeAreaView style={styles.sheet}>
            <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheetBody}>
              <View style={styles.sheetHeader}>
                <ThemedText variant="heading">{label}</ThemedText>
                <Pressable accessibilityRole="button" onPress={() => setOpen(false)}><ThemedText variant="label" color={colors.primary}>Fechar</ThemedText></Pressable>
              </View>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: item.value === value }}
                    onPress={() => { onChange(item.value); setOpen(false); }}
                    style={({ pressed }) => [styles.option, item.value === value && styles.optionSelected, pressed && { opacity: 0.75 }]}>
                    <View style={styles.optionCopy}>
                      <ThemedText variant="bodyMedium" color={item.value === value ? colors.primary : colors.text}>{item.label}</ThemedText>
                      {item.detail ? <ThemedText variant="caption" color={colors.textMuted}>{item.detail}</ThemedText> : null}
                    </View>
                    {item.value === value ? <MaterialCommunityIcons color={colors.primary} name="check" size={22} /> : null}
                  </Pressable>
                )}
              />
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = {
  wrapper: { gap: spacing.sm } satisfies ViewStyle,
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  } satisfies ViewStyle,
  fieldError: { borderColor: colors.danger } satisfies ViewStyle,
  value: { flex: 1 } as const,
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay } satisfies ViewStyle,
  sheet: { maxHeight: '76%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, boxShadow: shadows.overlay } satisfies ViewStyle,
  sheetBody: { maxHeight: '100%', padding: spacing.lg, gap: spacing.md } satisfies ViewStyle,
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.md } satisfies ViewStyle,
  option: { minHeight: 58, flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border } satisfies ViewStyle,
  optionSelected: { backgroundColor: colors.primarySoft } satisfies ViewStyle,
  optionCopy: { flex: 1, gap: spacing.xxs } satisfies ViewStyle,
};
