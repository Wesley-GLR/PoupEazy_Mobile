import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { queryKeys, useEmailPreferences, useUpdateEmailPreferences } from '@/api/hooks';
import { emailPreferencesService } from '@/api/services';
import type { EmailPreferences } from '@/types/api';

jest.mock('@/api/services', () => ({ emailPreferencesService: { get: jest.fn(), update: jest.fn() } }));

test('um GET antigo que termina apos salvar nao restaura preferencias obsoletas', async () => {
  const old: EmailPreferences = {
    alerta_orcamento_ativo: false, alerta_orcamento_percentual: 80, email_verificado: true,
    alerta_despesa_ativo: false, alerta_despesa_valor_minimo: 100,
    alerta_receita_ativo: false, alerta_receita_valor_minimo: 100, alerta_meta_concluida_ativo: false,
  };
  const saved: EmailPreferences = { ...old, alerta_orcamento_ativo: true, alerta_orcamento_percentual: 65 };
  let resolveOld!: (preferences: EmailPreferences) => void;
  const staleRequest = new Promise<EmailPreferences>(resolve => { resolveOld = resolve; });
  jest.mocked(emailPreferencesService.get).mockReturnValue(staleRequest);
  jest.mocked(emailPreferencesService.update).mockResolvedValue(saved);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => ({ query: useEmailPreferences(), mutation: useUpdateEmailPreferences() }), { wrapper });
  try {
    await waitFor(() => expect(emailPreferencesService.get).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.mutation.mutateAsync({
        alerta_orcamento_ativo: true, alerta_orcamento_percentual: 65,
        alerta_despesa_ativo: false, alerta_despesa_valor_minimo: 100,
        alerta_receita_ativo: false, alerta_receita_valor_minimo: 100, alerta_meta_concluida_ativo: false,
      });
    });
    await act(async () => { resolveOld(old); await staleRequest; });
    expect(client.getQueryData(queryKeys.emailPreferences)).toEqual(saved);
    await waitFor(() => expect(result.current.query.data).toEqual(saved));
  } finally {
    unmount(); client.clear();
  }
});
