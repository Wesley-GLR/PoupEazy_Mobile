import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { authService } from '@/api/services';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { clearSessionToken, getSessionToken, setSessionToken } from '@/auth/token-storage';
import type { AuthResponse, Profile } from '@/types/api';

// Somente as fronteiras externas são simuladas. Os providers e o cache são reais.
jest.mock('@/api/services', () => ({
  authService: {
    login: jest.fn(),
    me: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('@/auth/token-storage', () => ({
  getSessionToken: jest.fn(),
  setSessionToken: jest.fn(),
  clearSessionToken: jest.fn(),
}));

jest.mock('@/api/client', () => ({
  setUnauthorizedHandler: jest.fn(),
}));

const authServiceMock = jest.mocked(authService);
const getSessionTokenMock = jest.mocked(getSessionToken);
const setSessionTokenMock = jest.mocked(setSessionToken);
const clearSessionTokenMock = jest.mocked(clearSessionToken);

const profile: Profile = {
  id: 'usuario-integracao',
  nome: 'Pessoa de Teste',
  telefone: null,
};

const session: AuthResponse = {
  token: 'token-ficticio-integracao',
  user: { id: 'usuario-integracao', email: 'teste@example.com' },
  profile,
};

describe('Integração do contexto de autenticação', () => {
  let queryClient: QueryClient;

  function renderAuth() {
    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      );
    }

    return renderHook(() => useAuth(), { wrapper: Wrapper });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });
    getSessionTokenMock.mockResolvedValue(null);
    setSessionTokenMock.mockResolvedValue(undefined);
    clearSessionTokenMock.mockResolvedValue(undefined);
    authServiceMock.login.mockResolvedValue(session);
    authServiceMock.me.mockResolvedValue({ user: session.user, profile });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  test('encerra a restauração sem autenticar quando não existe token salvo', async () => {
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(authServiceMock.me).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  test('normaliza o e-mail, salva o token e autentica após o login', async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('  TESTE@Example.COM  ', 'SenhaTeste123!');
    });

    expect(authServiceMock.login).toHaveBeenCalledTimes(1);
    expect(authServiceMock.login).toHaveBeenCalledWith('teste@example.com', 'SenhaTeste123!');
    expect(setSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(setSessionTokenMock).toHaveBeenCalledWith(session.token);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(session.user);
    expect(result.current.profile).toEqual(profile);
  });

  test('mantém a sessão vazia e propaga o erro quando o login falha', async () => {
    const error = new Error('Credenciais inválidas.');
    authServiceMock.login.mockRejectedValueOnce(error);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.signIn('teste@example.com', 'senha-incorreta')).rejects.toBe(error);
    });

    expect(setSessionTokenMock).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  test('remove token, usuário, perfil e dados privados do cache ao sair', async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signIn('teste@example.com', 'SenhaTeste123!');
    });
    queryClient.setQueryData(['despesas', session.user.id], [{ id: 'despesa-privada', valor: 35 }]);
    expect(result.current.isAuthenticated).toBe(true);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);

    await act(async () => {
      await result.current.signOut();
    });

    expect(clearSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(queryClient.getQueryData(['despesas', session.user.id])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  test('restaura usuário e perfil usando me quando existe um token válido', async () => {
    getSessionTokenMock.mockResolvedValueOnce(session.token);
    const { result } = renderAuth();

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(authServiceMock.me).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(session.user);
    expect(result.current.profile).toEqual(profile);
    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(clearSessionTokenMock).not.toHaveBeenCalled();
  });

  test('descarta token e cache quando a validação da sessão salva falha', async () => {
    getSessionTokenMock.mockResolvedValueOnce('token-expirado');
    authServiceMock.me.mockRejectedValueOnce(new Error('Sessão expirada.'));
    queryClient.setQueryData(['despesas', session.user.id], [{ id: 'despesa-anterior' }]);
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(authServiceMock.me).toHaveBeenCalledTimes(1);
    expect(clearSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  test('atualiza o perfil compartilhado após a confirmação do serviço', async () => {
    const changes = { nome: 'Nome Atualizado', telefone: '11987654321' };
    const updatedProfile: Profile = { ...profile, ...changes };
    getSessionTokenMock.mockResolvedValueOnce(session.token);
    authServiceMock.updateProfile.mockResolvedValueOnce(updatedProfile);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toEqual(profile);

    await act(async () => {
      await result.current.updateProfile(changes);
    });

    expect(authServiceMock.updateProfile).toHaveBeenCalledWith(changes);
    expect(result.current.profile).toEqual(updatedProfile);
    expect(result.current.user).toEqual(session.user);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
