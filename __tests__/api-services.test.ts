jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '@/api/client';
import {
  authService,
  categoriesService,
  integrationsService,
  transactionsService,
} from '@/api/services';
import type { Paginated, Transaction } from '@/types/api';

const getMock = api.get as jest.Mock;
const postMock = api.post as jest.Mock;
const patchMock = api.patch as jest.Mock;
const deleteMock = api.delete as jest.Mock;

const transaction: Transaction = {
  id: 'transaction-1',
  id_orcamento: 'budget-1',
  id_categoria: 'category-1',
  id_metas: null,
  valor: '25.90',
  data_transacao: '2026-08-26',
  descricao: 'Mercado',
  tipo: 'despesa',
  origem: 'manual',
  status: 'confirmada',
  nlp_metadata: null,
};

describe('API service contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login sends credentials without requiring an existing session', async () => {
    postMock.mockResolvedValue({ token: 'token', user: {}, profile: null });

    await authService.login('pessoa@example.com', 'senha-segura');

    expect(postMock).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'pessoa@example.com', password: 'senha-segura' },
      { auth: false },
    );
  });

  test('registration normalizes an empty optional phone to null', async () => {
    postMock.mockResolvedValue({ token: 'token', user: {}, profile: null });

    await authService.register({
      email: 'pessoa@example.com',
      password: 'senha-segura',
      nome: 'Pessoa',
      telefone: '',
    });

    expect(postMock).toHaveBeenCalledWith(
      '/auth/register',
      {
        email: 'pessoa@example.com',
        password: 'senha-segura',
        nome: 'Pessoa',
        telefone: null,
      },
      { auth: false },
    );
  });

  test('transaction filters are encoded and empty values are omitted', async () => {
    getMock.mockResolvedValue([]);

    await transactionsService.list({
      q: 'mercado & casa',
      tipo: 'despesa',
      id_metas: '',
      page: 2,
      limit: 10,
    });

    expect(getMock).toHaveBeenCalledWith(
      '/despesas?q=mercado+%26+casa&tipo=despesa&page=2&limit=10',
    );
  });

  test('legacy transaction arrays are adapted to the paginated contract', async () => {
    getMock.mockResolvedValue([transaction]);

    await expect(transactionsService.list()).resolves.toEqual({
      data: [transaction],
      pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
    });
  });

  test('native paginated transaction responses remain unchanged', async () => {
    const response: Paginated<Transaction> = {
      data: [transaction],
      pagination: { page: 2, limit: 10, total: 14, totalPages: 2 },
    };
    getMock.mockResolvedValue(response);

    await expect(transactionsService.list({ page: 2 })).resolves.toBe(response);
  });

  test('transaction updates and removals use the protected resource endpoint', async () => {
    patchMock.mockResolvedValue({ ...transaction, descricao: 'Mercado do mês' });
    deleteMock.mockResolvedValue(undefined);

    await transactionsService.update('transaction-1', { descricao: 'Mercado do mês' });
    await transactionsService.remove('transaction-1');

    expect(patchMock).toHaveBeenCalledWith(
      '/despesas/transaction-1',
      { descricao: 'Mercado do mês' },
    );
    expect(deleteMock).toHaveBeenCalledWith('/despesas/transaction-1');
  });

  test('category creation preserves nullable icon values', async () => {
    postMock.mockResolvedValue({});

    await categoriesService.create({ nome: 'Casa', tipo: 'despesa_fixa', icone: null });

    expect(postMock).toHaveBeenCalledWith(
      '/categorias',
      { nome: 'Casa', tipo: 'despesa_fixa', icone: null },
    );
  });

  test('Open Finance item and integration identifiers are URL encoded', async () => {
    getMock.mockResolvedValue({ transactions: [] });
    postMock.mockResolvedValue({ inserted: 0 });

    await integrationsService.transactions('item/id com espaço');
    await integrationsService.sync('integration/id com espaço');

    expect(getMock).toHaveBeenCalledWith(
      '/pluggy/transactions/item%2Fid%20com%20espa%C3%A7o',
    );
    expect(postMock).toHaveBeenCalledWith(
      '/pluggy/sync/integration%2Fid%20com%20espa%C3%A7o',
    );
  });
});
