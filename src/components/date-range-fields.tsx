import NativeDatePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme';

import { Button, ThemedText } from './ui';

type DateRangeFieldsProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startError?: string;
  endError?: string;
  disabled?: boolean;
};

const displayDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  ? value.split('-').reverse().join('/') : 'Selecionar data';

export function DateRangeFields({ startDate, endDate, onStartChange, onEndChange, startError, endError, disabled }: DateRangeFieldsProps) {
  const [editing, setEditing] = useState<'start' | 'end' | null>(null);
  const selected = editing === 'start' ? startDate : endDate;
  const pickerDate = new Date(`${selected}T12:00:00Z`);

  return (
    <View style={styles.fields}>
      <Button testID="report-start-date" title={`Data inicial: ${displayDate(startDate)}`} variant="secondary" disabled={disabled} onPress={() => setEditing('start')} />
      {startError ? <ThemedText selectable color={colors.danger} accessibilityLiveRegion="polite">{startError}</ThemedText> : null}
      <Button testID="report-end-date" title={`Data final: ${displayDate(endDate)}`} variant="secondary" disabled={disabled} onPress={() => setEditing('end')} />
      {endError ? <ThemedText selectable color={colors.danger} accessibilityLiveRegion="polite">{endError}</ThemedText> : null}
      {editing && !disabled ? (
        <>
          <NativeDatePicker
            testID="report-date-picker"
            value={Number.isNaN(pickerDate.getTime()) ? new Date('2000-01-01T12:00:00Z') : pickerDate}
            mode="date"
            minimumDate={new Date('2000-01-01T00:00:00Z')}
            maximumDate={new Date('2100-12-31T23:59:59Z')}
            // Datas civis: o seletor e a conversão usam UTC, sem deslocar o dia pelo fuso.
            timeZoneName="UTC"
            locale="pt_BR"
            accentColor={colors.primary}
            positiveButton={{ label: 'Selecionar' }}
            negativeButton={{ label: 'Cancelar' }}
            onDismiss={() => setEditing(null)}
            onValueChange={(_event, date) => {
              if (Number.isNaN(date.getTime())) return;
              const value = date.toISOString().slice(0, 10);
              if (editing === 'start') onStartChange(value);
              else onEndChange(value);
              setEditing(null);
            }}
          />
          <Button title="Fechar calendário" variant="ghost" onPress={() => setEditing(null)} />
        </>
      ) : null}
    </View>
  );
}

const styles = { fields: { gap: spacing.sm } satisfies ViewStyle };
