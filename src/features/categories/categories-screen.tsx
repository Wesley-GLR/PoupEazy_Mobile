import { router } from 'expo-router';
import { Alert, RefreshControl, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCategories, useDeleteCategory } from '@/api/hooks';
import { fabClearance, FloatingActionButton } from '@/components/floating-action-button';
import { IconButton } from '@/components/icon-button';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ScreenContainer, ThemedText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Category } from '@/types/api';
import { getErrorMessage } from '@/utils/format';

const typeLabels: Record<Category['tipo'], string> = {
  despesa_fixa: 'Despesa fixa',
  despesa_variavel: 'Despesa variável',
  receita: 'Receita',
};

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const query = useCategories();
  const remove = useDeleteCategory();
  if (query.isLoading) return <LoadingState message="Carregando categorias…" />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const categories = query.data ?? [];
  const personal = categories.filter((item) => !item.sistema);
  const system = categories.filter((item) => item.sistema);

  function confirmDelete(category: Category) {
    Alert.alert('Excluir categoria?', `“${category.nome}” só poderá ser removida se não estiver em uso.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate(category.id, { onError: (error) => Alert.alert('Não foi possível excluir', getErrorMessage(error)) }) },
    ]);
  }

  function renderCategory(category: Category) {
    const tone = category.tipo === 'receita' ? 'success' : category.tipo === 'despesa_fixa' ? 'info' : 'warning';
    return (
      <View key={category.id} style={styles.row}>
        <View style={[styles.initial, { backgroundColor: category.tipo === 'receita' ? colors.successSoft : colors.primarySoft }]}>
          <ThemedText variant="label" color={category.tipo === 'receita' ? colors.success : colors.primary}>{category.nome.slice(0, 1).toUpperCase()}</ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText variant="bodyMedium">{category.nome}</ThemedText>
          <Badge label={typeLabels[category.tipo]} tone={tone} />
        </View>
        {!category.sistema ? (
          <View style={styles.actions}>
            <IconButton icon="pencil-outline" label={`Editar ${category.nome}`} onPress={() => router.push({ pathname: '/(modals)/category-form', params: { id: category.id } })} />
            <IconButton icon="trash-can-outline" label={`Excluir ${category.nome}`} color={colors.danger} onPress={() => confirmDelete(category)} />
          </View>
        ) : <Badge label="PoupEazy" tone="neutral" />}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <ScreenContainer
        contentStyle={{ paddingBottom: insets.bottom + fabClearance }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}>
        <ThemedText color={colors.textMuted}>Categorias do sistema ficam protegidas; você pode criar e editar as suas.</ThemedText>
        <Card>
          <ThemedText variant="heading">Minhas categorias</ThemedText>
          {personal.length ? personal.map(renderCategory) : <EmptyState title="Nenhuma personalizada" message="Crie uma categoria para adaptar o PoupEazy à sua rotina." />}
        </Card>
        <Card>
          <ThemedText variant="heading">Categorias PoupEazy</ThemedText>
          {system.map(renderCategory)}
        </Card>
      </ScreenContainer>
      <FloatingActionButton bottomOffset={insets.bottom} label="Nova categoria" onPress={() => router.push('/(modals)/category-form')} />
    </View>
  );
}

const styles = {
  fill: { flex: 1, backgroundColor: colors.background } satisfies ViewStyle,
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm } satisfies ViewStyle,
  initial: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' } satisfies ViewStyle,
  flex: { flex: 1, gap: spacing.xs } satisfies ViewStyle,
  actions: { flexDirection: 'row' } satisfies ViewStyle,
};
