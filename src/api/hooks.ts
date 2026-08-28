import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  BudgetInput,
  CategoryInput,
  GoalInput,
  TransactionFilters,
  TransactionInput,
} from '@/types/api';

import {
  budgetsService,
  categoriesService,
  goalsService,
  integrationsService,
  transactionsService,
} from './services';

export const queryKeys = {
  transactions: ['transactions'] as const,
  categories: ['categories'] as const,
  budgets: ['budgets'] as const,
  goals: ['goals'] as const,
  integrations: ['integrations'] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.transactions, filters],
    queryFn: () => transactionsService.list(filters),
  });
}

export function useCreateTransaction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionsService.create(input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.transactions }),
        client.invalidateQueries({ queryKey: queryKeys.budgets }),
        client.invalidateQueries({ queryKey: queryKeys.goals }),
      ]);
    },
  });
}

export function useUpdateTransaction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      transactionsService.update(id, input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.transactions }),
        client.invalidateQueries({ queryKey: queryKeys.budgets }),
        client.invalidateQueries({ queryKey: queryKeys.goals }),
      ]);
    },
  });
}

export function useDeleteTransaction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: transactionsService.remove,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.transactions }),
        client.invalidateQueries({ queryKey: queryKeys.budgets }),
        client.invalidateQueries({ queryKey: queryKeys.goals }),
      ]);
    },
  });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesService.list, staleTime: 5 * 60_000 });
}

export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesService.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useUpdateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) => categoriesService.update(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useBudgets() {
  return useQuery({ queryKey: queryKeys.budgets, queryFn: budgetsService.list });
}

export function useCreateBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetsService.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.budgets }),
  });
}

export function useGetOrCreateBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetsService.getOrCreate(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.budgets }),
  });
}

export function useUpdateBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BudgetInput> }) => budgetsService.update(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.budgets }),
  });
}

export function useGoals() {
  return useQuery({ queryKey: queryKeys.goals, queryFn: goalsService.list });
}

export function useCreateGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) => goalsService.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

export function useUpdateGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GoalInput> }) => goalsService.update(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

export function useDeleteGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: goalsService.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

export function useIntegrations() {
  return useQuery({ queryKey: queryKeys.integrations, queryFn: integrationsService.list });
}

export function useConnectIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ instituicao, itemId }: { instituicao: string; itemId: string }) =>
      integrationsService.connect(instituicao, itemId),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.integrations }),
  });
}

export function useDisconnectIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: integrationsService.disconnect,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.integrations }),
  });
}

export function usePluggyConnectToken() {
  return useMutation({ mutationFn: integrationsService.connectToken });
}

export function usePluggyTransactions() {
  return useMutation({ mutationFn: integrationsService.transactions });
}

export function useSyncIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: integrationsService.sync,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.integrations }),
        client.invalidateQueries({ queryKey: queryKeys.transactions }),
        client.invalidateQueries({ queryKey: queryKeys.budgets }),
        client.invalidateQueries({ queryKey: queryKeys.goals }),
      ]);
    },
  });
}
