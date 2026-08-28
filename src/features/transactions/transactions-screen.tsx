import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View, type ViewStyle } from 'react-native';

import { useDeleteTransaction, useTransactions } from '@/api/hooks';
import { AppHeader } from '@/components/app-header';
import { ChoiceChips } from '@/components/choice-chips';
import { FloatingActionButton } from '@/components/floating-action-button';
import { PeriodNavigator } from '@/components/period-navigator';
import { TransactionRow } from '@/components/transaction-row';
import { EmptyState, ErrorState, LoadingState, TextField, ThemedText } from '@/components/ui';
import { usePeriod } from '@/state/period-context';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/format';

type TypeFilter = 'todos' | 'despesa' | 'receita';

export default function TransactionsScreen() {
  const { startDate, endDate } = usePeriod();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('todos');
  const query = useTransactions({ data_inicio: startDate, data_fim: endDate });
  const remove = useDeleteTransaction();
  const items = useMemo(() => (query.data?.data ?? []).filter((item) => {
    const matchesText = item.descricao.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'));
    const matchesType = type === 'todos' || item.tipo === type;
    return matchesText && matchesType;
  }), [query.data?.data, search, type]);

  function confirmDelete(id: string, description: string) {
    Alert.alert('Excluir transação?', `“${description}” será removida permanentemente.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          remove.mutate(id, {
            onError: (error) => Alert.alert('Não foi possível excluir', getErrorMessage(error)),
          });
        },
      },
    ]);
  }

  if (query.isLoading) return <LoadingState message="Carregando transações…" />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  return (
    <View style={styles.container}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <AppHeader title="Transações" subtitle="Toque para editar; segure para excluir." />
            <PeriodNavigator />
            <TextField label="Buscar" placeholder="Descrição da transação" value={search} onChangeText={setSearch} />
            <ChoiceChips
              label="Filtrar por tipo"
              value={type}
              onChange={setType}
              choices={[
                { value: 'todos', label: 'Todas' },
                { value: 'despesa', label: 'Despesas' },
                { value: 'receita', label: 'Receitas' },
              ]}
            />
            <ThemedText variant="caption" color={colors.textMuted}>{items.length} resultado(s)</ThemedText>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Nenhuma transação" message="Ajuste os filtros ou registre a primeira movimentação deste período." />}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onPress={() => router.push({ pathname: '/(modals)/transaction-form', params: { id: item.id } })}
            onLongPress={() => confirmDelete(item.id, item.descricao)}
          />
        )}
      />
      <FloatingActionButton label="Nova transação" onPress={() => router.push('/(modals)/transaction-form')} />
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: colors.background } satisfies ViewStyle,
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 110 } satisfies ViewStyle,
  header: { gap: spacing.lg, marginBottom: spacing.md } satisfies ViewStyle,
};
