import { router } from 'expo-router';
import { Pressable, RefreshControl, View, type ViewStyle } from 'react-native';

import { useBudgets, useTransactions } from '@/api/hooks';
import { AppHeader } from '@/components/app-header';
import { PeriodNavigator } from '@/components/period-navigator';
import { SummaryCard } from '@/components/summary-card';
import { Card, EmptyState, ErrorState, LoadingState, ProgressBar, ScreenContainer, ThemedText } from '@/components/ui';
import { usePeriod } from '@/state/period-context';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency, moneyToNumber, MONTH_NAMES } from '@/utils/format';

export default function BudgetScreen() {
  const { month, year, startDate, endDate } = usePeriod();
  const budgetsQuery = useBudgets();
  const transactionsQuery = useTransactions({ data_inicio: startDate, data_fim: endDate });
  const budgets = budgetsQuery.data ?? [];
  const current = budgets.find((item) => item.mes === month && item.ano === year);
  const transactions = transactionsQuery.data?.data ?? [];
  const expenses = transactions.filter((item) => item.status === 'confirmada' && item.tipo === 'despesa');
  const income = transactions.filter((item) => item.status === 'confirmada' && item.tipo === 'receita').reduce((sum, item) => sum + moneyToNumber(item.valor), 0);
  const spent = expenses.reduce((sum, item) => sum + moneyToNumber(item.valor), 0);
  const planned = moneyToNumber(current?.valor_planejado);
  const available = planned - spent;
  const progress = planned > 0 ? (spent / planned) * 100 : 0;
  const breakdown = (() => {
    const totals = new Map<string, number>();
    expenses.forEach((item) => {
      const name = item.categoria?.nome ?? 'Outros';
      totals.set(name, (totals.get(name) ?? 0) + moneyToNumber(item.valor));
    });
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();
  const yearBudgets = budgets.filter((item) => item.ano === year).sort((a, b) => a.mes - b.mes);

  const loading = budgetsQuery.isLoading || transactionsQuery.isLoading;
  const refresh = () => void Promise.all([budgetsQuery.refetch(), transactionsQuery.refetch()]);
  if (loading) return <LoadingState message="Calculando seu orçamento…" />;
  if (budgetsQuery.isError || transactionsQuery.isError) return <ErrorState onRetry={refresh} />;

  return (
    <ScreenContainer refreshControl={<RefreshControl refreshing={budgetsQuery.isRefetching || transactionsQuery.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}>
      <AppHeader title="Orçamento" subtitle="Planejado versus gasto, sem misturar as receitas." />
      <PeriodNavigator />
      {current && planned > 0 ? (
        <>
          <View style={styles.grid}>
            <SummaryCard label="Planejado" value={formatCurrency(planned)} icon="clipboard-text-outline" />
            <SummaryCard label="Gasto" value={formatCurrency(spent)} icon="trending-down" tone="danger" />
            <SummaryCard label="Receitas" value={formatCurrency(income)} icon="trending-up" tone="success" />
            <SummaryCard label="Disponível" value={formatCurrency(available)} icon="cash" tone={available >= 0 ? 'success' : 'danger'} />
          </View>
          <Card>
            <View style={styles.rowBetween}>
              <ThemedText variant="heading">Consumo do orçamento</ThemedText>
              <ThemedText variant="label" color={progress > 100 ? colors.danger : colors.primary}>{Math.round(progress)}%</ThemedText>
            </View>
            <ProgressBar value={progress} tone={progress > 100 ? 'danger' : progress >= 80 ? 'primary' : 'success'} />
            <ThemedText variant="caption" color={colors.textMuted}>{formatCurrency(spent)} de {formatCurrency(planned)}</ThemedText>
            {progress > 100 ? <ThemedText variant="caption" color={colors.danger}>O limite foi excedido em {formatCurrency(spent - planned)}.</ThemedText> : null}
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(modals)/budget-form', params: { id: current.id } })} style={styles.editButton}>
              <ThemedText variant="label" color={colors.primary}>Editar orçamento de {MONTH_NAMES[month - 1]}</ThemedText>
            </Pressable>
          </Card>
        </>
      ) : (
        <Card style={styles.dashed}>
          <EmptyState title="Defina um limite para o mês" message={`Ainda não há valor planejado para ${MONTH_NAMES[month - 1]} de ${year}.`} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/(modals)/budget-form')} style={styles.primaryAction}>
            <ThemedText variant="label" color={colors.textOnPrimary}>Criar orçamento</ThemedText>
          </Pressable>
        </Card>
      )}

      {breakdown.length ? (
        <Card>
          <ThemedText variant="heading">Despesas por categoria</ThemedText>
          {breakdown.map((item) => (
            <View key={item.name} style={styles.breakdownRow}>
              <ThemedText style={styles.flex}>{item.name}</ThemedText>
              <ThemedText variant="label" color={colors.danger}>{formatCurrency(item.value)}</ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {yearBudgets.length ? (
        <Card>
          <ThemedText variant="heading">Planejamento de {year}</ThemedText>
          {yearBudgets.map((item) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/(modals)/budget-form', params: { id: item.id } })} style={styles.breakdownRow}>
              <ThemedText style={styles.flex}>{MONTH_NAMES[item.mes - 1]}</ThemedText>
              <ThemedText variant="label" color={colors.primary}>{formatCurrency(item.valor_planejado)}</ThemedText>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = {
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } satisfies ViewStyle,
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md } satisfies ViewStyle,
  editButton: { alignItems: 'center', padding: spacing.md } satisfies ViewStyle,
  dashed: { borderStyle: 'dashed' } satisfies ViewStyle,
  primaryAction: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md } satisfies ViewStyle,
  breakdownRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border } satisfies ViewStyle,
  flex: { flex: 1 },
};
