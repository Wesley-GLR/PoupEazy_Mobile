export type MoneyValue = string | number;

export interface AuthUser {
  id: string;
  email: string;
  criado_em?: string;
}

export interface Profile {
  id: string;
  nome: string;
  telefone: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  profile: Profile | null;
}

export interface Category {
  id: string;
  id_usuario: string | null;
  nome: string;
  tipo: 'despesa_fixa' | 'despesa_variavel' | 'receita';
  icone: string | null;
  sistema: boolean;
}

export interface Budget {
  id: string;
  id_usuario: string;
  mes: number;
  ano: number;
  valor_planejado: MoneyValue;
  valor_real: MoneyValue;
  criado_em?: string;
  atualizado_em?: string;
}

export interface Goal {
  id: string;
  id_usuario: string;
  nome: string;
  descricao: string | null;
  valor_objetivo: MoneyValue;
  valor_atual: MoneyValue;
  data_limite: string;
  status: 'ativa' | 'concluida' | 'cancelada';
  criado_em?: string;
}

export interface Transaction {
  id: string;
  id_orcamento: string;
  id_categoria: string;
  id_metas: string | null;
  valor: MoneyValue;
  data_transacao: string;
  descricao: string;
  tipo: 'despesa' | 'receita';
  origem: 'manual' | 'open_finance' | 'chatbot';
  status: 'pendente' | 'confirmada' | 'cancelada';
  nlp_metadata: Record<string, unknown> | null;
  id_externo?: string | null;
  criado_em?: string;
  categoria?: Category;
}

export interface Integration {
  id: string;
  instituicao: string;
  expira_em: string;
  ultimo_uso: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface PluggyTransaction {
  id_externo: string;
  descricao: string;
  valor: number;
  tipo: 'despesa' | 'receita';
  data: string;
}

export interface IntegrationSyncResult {
  integrationId: string;
  accounts: number;
  found: number;
  inserted: number;
  updated: number;
  unchanged: number;
  budgetsCreated: number;
  syncedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface TransactionFilters {
  q?: string;
  tipo?: Transaction['tipo'];
  origem?: Transaction['origem'];
  status?: Transaction['status'];
  id_categoria?: string;
  id_orcamento?: string;
  id_metas?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export type TransactionInput = Pick<
  Transaction,
  'id_orcamento' | 'id_categoria' | 'valor' | 'data_transacao' | 'descricao' | 'tipo'
> &
  Partial<Pick<Transaction, 'id_metas' | 'origem' | 'status' | 'nlp_metadata' | 'id_externo'>>;

export type CategoryInput = Pick<Category, 'nome' | 'tipo'> & { icone?: string | null };

export type GoalInput = Pick<Goal, 'nome' | 'valor_objetivo' | 'data_limite'> & {
  descricao?: string | null;
  status?: Goal['status'];
};

export type BudgetInput = Pick<Budget, 'mes' | 'ano'> & { valor_planejado?: MoneyValue };
