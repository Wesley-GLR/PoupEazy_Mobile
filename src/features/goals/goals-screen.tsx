import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, View, type ViewStyle } from 'react-native';

import { useDeleteGoal, useGoals, useTransactions, useUpdateGoal } from '@/api/hooks';
import { AppHeader } from '@/components/app-header';
import { FloatingActionButton } from '@/components/floating-action-button';
import { IconButton } from '@/components/icon-button';
import { Card, EmptyState, ErrorState, LoadingState, ProgressBar, ScreenContainer, ThemedText, Badge } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { Goal } from '@/types/api';
import { daysUntil, formatCurrency, formatDate, getErrorMessage, moneyToNumber } from '@/utils/format';

export default function GoalsScreen() {
  const goalsQuery = useGoals();
  const transactionsQuery = useTransactions();
  const update = useUpdateGoal();
  const remove = useDeleteGoal();
  const goals = goalsQuery.data ?? [];
  const active = goals.filter((item) => item.status === 'ativa');
  const finished = goals.filter((item) => item.status !== 'ativa');

  const refresh = () => void Promise.all([goalsQuery.refetch(), transactionsQuery.refetch()]);
  if (goalsQuery.isLoading || transactionsQuery.isLoading) return <LoadingState message="Carregando suas metas…" />;
  if (goalsQuery.isError || transactionsQuery.isError) return <ErrorState onRetry={refresh} />;

  function setStatus(goal: Goal, status: 'concluida' | 'cancelada') {
    const label = status === 'concluida' ? 'concluir' : 'cancelar';
    Alert.alert(`${label[0].toUpperCase()}${label.slice(1)} meta?`, goal.nome, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Confirmar', style: status === 'cancelada' ? 'destructive' : 'default', onPress: () => update.mutate({ id: goal.id, input: { status } }, { onError: (error) => Alert.alert('Não foi possível atualizar', getErrorMessage(error)) }) },
    ]);
  }

  function deleteGoal(goal: Goal) {
    Alert.alert('Excluir meta?', `“${goal.nome}” e seu histórico vinculado podem ser afetados.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate(goal.id, { onError: (error) => Alert.alert('Não foi possível excluir', getErrorMessage(error)) }) },
    ]);
  }

  return (
    <View style={styles.fill}>
      <ScreenContainer refreshControl={<RefreshControl refreshing={goalsQuery.isRefetching || transactionsQuery.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}>
        <AppHeader title="Metas" subtitle="Transforme seus planos em pequenas conquistas." />
        {active.length ? active.map((goal) => {
          const progress = moneyToNumber(goal.valor_objetivo) > 0 ? moneyToNumber(goal.valor_atual) / moneyToNumber(goal.valor_objetivo) * 100 : 0;
          const days = daysUntil(goal.data_limite);
          const movements = (transactionsQuery.data?.data ?? []).filter((item) => item.id_metas === goal.id).slice(0, 3);
          return (
            <Card key={goal.id}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <ThemedText variant="heading">{goal.nome}</ThemedText>
                  {goal.descricao ? <ThemedText variant="caption" color={colors.textMuted}>{goal.descricao}</ThemedText> : null}
                </View>
                <IconButton icon="pencil-outline" label={`Editar ${goal.nome}`} onPress={() => router.push({ pathname: '/(modals)/goal-form', params: { id: goal.id } })} />
              </View>
              <ThemedText variant="bodyMedium">{formatCurrency(goal.valor_atual)} de {formatCurrency(goal.valor_objetivo)}</ThemedText>
              <ProgressBar value={progress} tone={progress >= 100 ? 'success' : 'primary'} />
              <View style={styles.cardHeader}>
                <ThemedText variant="caption" color={colors.textMuted}>Prazo: {formatDate(goal.data_limite)}</ThemedText>
                <Badge label={days < 0 ? 'Vencida' : days === 0 ? 'Vence hoje' : `${days} dias`} tone={days < 0 ? 'danger' : days <= 7 ? 'warning' : 'info'} />
              </View>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(modals)/goal-movement', params: { goalId: goal.id } })} style={styles.movementButton}>
                <ThemedText variant="label" color={colors.primary}>+ Registrar aporte ou retirada</ThemedText>
              </Pressable>
              {movements.length ? (
                <View style={styles.history}>
                  <ThemedText variant="label" color={colors.textMuted}>Últimas movimentações</ThemedText>
                  {movements.map((item) => (
                    <View key={item.id} style={styles.historyRow}>
                      <ThemedText variant="caption" style={styles.flex} numberOfLines={1}>{item.descricao}</ThemedText>
                      <ThemedText variant="caption" color={item.tipo === 'despesa' ? colors.success : colors.danger}>{item.tipo === 'despesa' ? '+' : '−'} {formatCurrency(item.valor)}</ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={() => setStatus(goal, 'concluida')}><ThemedText variant="label" color={colors.success}>Concluir</ThemedText></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setStatus(goal, 'cancelada')}><ThemedText variant="label" color={colors.danger}>Cancelar meta</ThemedText></Pressable>
              </View>
            </Card>
          );
        }) : <EmptyState title="Sua próxima conquista começa aqui" message="Crie uma meta e acompanhe cada aporte." />}

        {finished.length ? (
          <View style={styles.section}>
            <ThemedText variant="heading" color={colors.textMuted}>Metas finalizadas</ThemedText>
            {finished.map((goal) => (
              <Card key={goal.id} style={styles.finishedCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.flex}>
                    <ThemedText variant="bodyMedium">{goal.nome}</ThemedText>
                    <ThemedText variant="caption" color={colors.textMuted}>{formatCurrency(goal.valor_atual)} de {formatCurrency(goal.valor_objetivo)}</ThemedText>
                  </View>
                  <Badge label={goal.status === 'concluida' ? 'Concluída' : 'Cancelada'} tone={goal.status === 'concluida' ? 'success' : 'neutral'} />
                  <IconButton icon="trash-can-outline" label={`Excluir ${goal.nome}`} color={colors.danger} onPress={() => deleteGoal(goal)} />
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenContainer>
      <FloatingActionButton label="Nova meta" onPress={() => router.push('/(modals)/goal-form')} />
    </View>
  );
}

const styles = {
  fill: { flex: 1, backgroundColor: colors.background } satisfies ViewStyle,
  flex: { flex: 1 } as const,
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md } satisfies ViewStyle,
  movementButton: { alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 1, borderBottomColor: colors.border } satisfies ViewStyle,
  history: { gap: spacing.sm } satisfies ViewStyle,
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md } satisfies ViewStyle,
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm } satisfies ViewStyle,
  section: { gap: spacing.md, marginTop: spacing.md } satisfies ViewStyle,
  finishedCard: { opacity: 0.82, padding: spacing.md } satisfies ViewStyle,
};
