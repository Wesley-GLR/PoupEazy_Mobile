import type {
  AuthResponse,
  AuthUser,
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  EmailPreferences,
  EmailPreferencesInput,
  ForgotPasswordResponse,
  Goal,
  GoalInput,
  Integration,
  IntegrationSyncResult,
  Paginated,
  PluggyTransaction,
  Profile,
  RegistrationResponse,
  ResendVerificationResponse,
  Transaction,
  TransactionFilters,
  TransactionInput,
  WhatsAppLinkStatus,
} from '@/types/api';

import { api } from './client';

function queryString(values: object): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const authService = {
  me: () => api.get<{ user: AuthUser; profile: Profile | null }>('/auth/me'),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }, { auth: false }),
  register: (input: { email: string; password: string; nome: string; telefone?: string }) =>
    api.post<RegistrationResponse>('/auth/register', { ...input, telefone: input.telefone || null }, { auth: false }),
  resendVerification: (email: string) =>
    api.post<ResendVerificationResponse>('/auth/resend-verification', { email }, { auth: false }),
  forgotPassword: (email: string) =>
    api.post<ForgotPasswordResponse>('/auth/forgot-password', { email }, { auth: false }),
  resetPassword: (token: string, novaSenha: string) =>
    api.post<void>('/auth/reset-password', { token, novaSenha }, { auth: false }),
  updatePassword: (novaSenha: string) => api.patch<void>('/auth/password', { novaSenha }),
  updateProfile: (input: Partial<Pick<Profile, 'nome' | 'telefone'>>) => api.patch<Profile>('/profile', input),
};

export const emailPreferencesService = {
  get: () => api.get<EmailPreferences>('/preferencias-email'),
  update: (input: EmailPreferencesInput) => api.patch<EmailPreferences>('/preferencias-email', {
    alerta_orcamento_ativo: input.alerta_orcamento_ativo,
    alerta_orcamento_percentual: input.alerta_orcamento_percentual,
    alerta_despesa_ativo: input.alerta_despesa_ativo,
    alerta_despesa_valor_minimo: input.alerta_despesa_valor_minimo,
    alerta_receita_ativo: input.alerta_receita_ativo,
    alerta_receita_valor_minimo: input.alerta_receita_valor_minimo,
    alerta_meta_concluida_ativo: input.alerta_meta_concluida_ativo,
  }),
};

export const transactionsService = {
  async list(filters: TransactionFilters = {}): Promise<Paginated<Transaction>> {
    const response = await api.get<Transaction[] | Paginated<Transaction>>(
      `/despesas${queryString(filters)}`,
    );
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1 },
      };
    }
    return response;
  },
  create: (input: TransactionInput) => api.post<Transaction | { duplicado: true }>('/despesas', input),
  update: (id: string, input: Partial<TransactionInput>) => api.patch<Transaction>(`/despesas/${id}`, input),
  remove: (id: string) => api.delete(`/despesas/${id}`),
};

export const whatsappService = {
  status: () => api.get<WhatsAppLinkStatus>('/whatsapp/vinculo'),
  createLink: () => api.post<{ url: string }>('/whatsapp/vinculo'),
  unlink: () => api.delete('/whatsapp/vinculo'),
};

export const categoriesService = {
  list: () => api.get<Category[]>('/categorias'),
  create: (input: CategoryInput) => api.post<Category>('/categorias', input),
  update: (id: string, input: Partial<CategoryInput>) => api.patch<Category>(`/categorias/${id}`, input),
  remove: (id: string) => api.delete(`/categorias/${id}`),
};

export const budgetsService = {
  list: () => api.get<Budget[]>('/orcamentos'),
  create: (input: BudgetInput) => api.post<Budget>('/orcamentos', input),
  getOrCreate: (input: BudgetInput) => api.post<Budget>('/orcamentos/get-or-create', input),
  update: (id: string, input: Partial<BudgetInput>) => api.patch<Budget>(`/orcamentos/${id}`, input),
};

export const goalsService = {
  list: () => api.get<Goal[]>('/metas'),
  create: (input: GoalInput) => api.post<Goal>('/metas', input),
  update: (id: string, input: Partial<GoalInput>) => api.patch<Goal>(`/metas/${id}`, input),
  remove: (id: string) => api.delete(`/metas/${id}`),
};

export const integrationsService = {
  list: () => api.get<Integration[]>('/integracoes'),
  connect: (instituicao: string, itemId: string) =>
    api.post<Integration>('/integracoes', { instituicao, itemId }),
  disconnect: (id: string) => api.delete(`/integracoes/${id}`),
  connectToken: () => api.get<{ connectToken: string }>('/pluggy/token'),
  transactions: (itemId: string) =>
    api.get<{ transactions: PluggyTransaction[] }>(`/pluggy/transactions/${encodeURIComponent(itemId)}`),
  sync: (integrationId: string) =>
    api.post<IntegrationSyncResult>(`/pluggy/sync/${encodeURIComponent(integrationId)}`),
};
