import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, View, type ViewStyle } from 'react-native';

import { Badge, ThemedText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Transaction } from '@/types/api';
import { formatCurrency, formatDate } from '@/utils/format';

export function TransactionRow({ transaction, onPress, onLongPress }: {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const income = transaction.tipo === 'receita';
  const color = income ? colors.success : colors.danger;
  return (
    <Pressable
      accessibilityLabel={`${transaction.descricao}, ${income ? 'receita' : 'despesa'} de ${formatCurrency(transaction.valor)}, em ${formatDate(transaction.data_transacao)}`}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.icon, { backgroundColor: income ? colors.successSoft : colors.dangerSoft }]}>
        <MaterialCommunityIcons color={color} name={income ? 'arrow-down-left' : 'arrow-up-right'} size={20} />
      </View>
      <View style={styles.copy}>
        <ThemedText variant="bodyMedium" numberOfLines={1}>{transaction.descricao}</ThemedText>
        <ThemedText variant="caption" color={colors.textMuted}>
          {formatDate(transaction.data_transacao)} · {transaction.categoria?.nome ?? 'Sem categoria'}
        </ThemedText>
      </View>
      <View style={styles.amount}>
        <ThemedText variant="label" color={color}>
          {income ? '+' : '−'} {formatCurrency(transaction.valor)}
        </ThemedText>
        {transaction.status !== 'confirmada' ? (
          <Badge label={transaction.status} tone={transaction.status === 'cancelada' ? 'danger' : 'warning'} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = {
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } satisfies ViewStyle,
  icon: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' } satisfies ViewStyle,
  copy: { flex: 1, gap: spacing.xxs } satisfies ViewStyle,
  amount: { alignItems: 'flex-end', gap: spacing.xs, maxWidth: '38%' } satisfies ViewStyle,
};
