import { router } from 'expo-router';
import { Pressable, RefreshControl, View, type ViewStyle } from 'react-native';

import { useTransactions, useBudgets } from '@/api/hooks';
import { useAuth } from '@/auth/auth-context';
import { AppHeader } from '@/components/app-header';
import { DonutChart } from '@/components/donut-chart';
import { PeriodNavigator } from '@/components/period-navigator';
import { SummaryCard } from '@/components/summary-card';
import { TransactionRow } from '@/components/transaction-row';
import { Card, EmptyState, ErrorState, LoadingState, ScreenContainer, ThemedText } from '@/components/ui';
import { usePeriod } from '@/state/period-context';
import { colors, spacing } from '@/theme';
import { formatCurrency, moneyToNumber } from '@/utils/format';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { startDate, endDate, label } = usePeriod();
  const transactionsQuery = useTransactions({ data_inicio: startDate, data_fim: endDate });
  const budgetsQuery = useBudgets();
  const transactions = transactionsQuery.data?.data ?? [];

  const confirmed = transactions.filter((item) => item.status === 'confirmada');
  const totalIncome = confirmed.filter((item) => item.tipo === 'receita').reduce((sum, item) => sum + moneyToNumber(item.valor), 0);
  const totalExpense = confirmed.filter((item) => item.tipo === 'despesa').reduce((sum, item) => sum + moneyToNumber(item.valor), 0);
  const selectedBudgets = (budgetsQuery.data ?? []).filter((budget) => {
    const value = budget.ano * 12 + budget.mes;
    const [startYear, startMonth] = startDate.split('-').map(Number);
    const [endYear, endMonth] = endDate.split('-').map(Number);
    return value >= startYear * 12 + startMonth && value <= endYear * 12 + endMonth;
  });
  const planned = selectedBudgets.reduce((sum, item) => sum + moneyToNumber(item.valor_planejado), 0);
  const categories = (() => {
    const totals = new Map<string, number>();
    confirmed.filter((item) => item.tipo === 'despesa').forEach((item) => {
      const name = item.categoria?.nome ?? 'Outros';
      totals.set(name, (totals.get(name) ?? 0) + moneyToNumber(item.valor));
    });
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  })();
  const recent = [...transactions]
    .sort((a, b) => `${b.data_transacao}${b.criado_em ?? ''}`.localeCompare(`${a.data_transacao}${a.criado_em ?? ''}`))
    .slice(0, 5);

  const loading = transactionsQuery.isLoading || budgetsQuery.isLoading;
  const refreshing = transactionsQuery.isRefetching || budgetsQuery.isRefetching;
  const refresh = () => void Promise.all([transactionsQuery.refetch(), budgetsQuery.refetch()]);

  if (loading) return <LoadingState message="Montando seu painel…" />;
  if (transactionsQuery.isError || budgetsQuery.isError) return <ErrorState onRetry={refresh} />;

  return (
    <ScreenContainer withTopInset refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <AppHeader
        title="Painel principal"
        subtitle={`Bem-vindo de volta${profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}.`}
      />
      <PeriodNavigator />
      <ThemedText variant="caption" color={colors.textMuted}>Resumo de {label.toLowerCase()}</ThemedText>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Receitas" value={formatCurrency(totalIncome)} icon="trending-up" tone="success" />
        <SummaryCard label="Despesas" value={formatCurrency(totalExpense)} icon="trending-down" tone="danger" />
        <SummaryCard label="Saldo" value={formatCurrency(totalIncome - totalExpense)} icon="wallet-outline" tone={totalIncome - totalExpense >= 0 ? 'primary' : 'danger'} />
        <SummaryCard label="Orçamento" value={selectedBudgets.length ? formatCurrency(planned) : 'Não definido'} icon="bullseye-arrow" tone="info" />
      </View>

      <Card>
        <View style={styles.sectionHeader}>
          <ThemedText variant="heading">Transações recentes</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/(tabs)/(transactions)')}>
            <ThemedText variant="label" color={colors.primary}>Ver todas</ThemedText>
          </Pressable>
        </View>
        {recent.length ? recent.map((item) => <TransactionRow key={item.id} transaction={item} />) : (
          <EmptyState title="Tudo tranquilo por aqui" message="Nenhuma transação foi encontrada neste período." />
        )}
      </Card>

      <Card>
        <ThemedText variant="heading">Despesas por categoria</ThemedText>
        <DonutChart data={categories} />
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push('/(modals)/transaction-form')} style={styles.quickAction}>
        <ThemedText variant="label" color={colors.primary}>+ Registrar nova transação</ThemedText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = {
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } satisfies ViewStyle,
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md } satisfies ViewStyle,
  quickAction: { alignItems: 'center', padding: spacing.lg } satisfies ViewStyle,
};
