import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/api/client';
import { EmailVerificationNotice } from '@/features/auth/email-verification-notice';
import LoginScreen from '@/features/auth/login-screen';
import RegisterScreen from '@/features/auth/register-screen';
import type { RegistrationResponse, ResendVerificationResponse } from '@/types/api';

const mockSignIn = jest.fn<Promise<void>, [string, string]>();
const mockSignUp = jest.fn<Promise<RegistrationResponse>, [unknown]>();
const mockResendVerification = jest.fn<Promise<ResendVerificationResponse>, [string]>();
const mockReplace = jest.fn();

jest.mock('@/auth/auth-context', () => ({
  useAuth: () => ({ signIn: mockSignIn, signUp: mockSignUp, resendVerification: mockResendVerification }),
}));

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/auth/token-storage', () => ({ getSessionToken: jest.fn(), clearSessionToken: jest.fn() }));

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Link: ({ children }: PropsWithChildren) => <Text>{children}</Text>,
    router: { replace: (...args: unknown[]) => mockReplace(...args) },
  };
});

jest.mock('@/features/auth/auth-shell', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AuthShell: ({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) => (
      <View><Text>{title}</Text><Text>{subtitle}</Text>{children}</View>
    ),
  };
});

describe('Confirmação de cadastro por e-mail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockReset();
    mockSignUp.mockReset();
    mockResendVerification.mockReset();
    mockSignUp.mockResolvedValue({ message: 'Confirme seu e-mail.', emailVerificationRequired: true });
    mockResendVerification.mockResolvedValue({ message: 'Solicitação recebida.' });
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  test('cadastro sem token mostra confirmação, sem login automático', async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId('register-name'), 'Nova Pessoa');
    fireEvent.changeText(screen.getByTestId('register-email'), 'nova@example.com');
    fireEvent.changeText(screen.getByTestId('register-password'), 'SenhaNova123!');
    fireEvent.changeText(screen.getByTestId('register-confirmation'), 'SenhaNova123!');
    fireEvent.press(screen.getByText('Criar conta'));

    await screen.findByTestId('verification-pending');

    expect(screen.getByText('nova@example.com')).toBeTruthy();
    expect(screen.getByTestId('resend-verification').props.accessibilityState.disabled).toBe(true);
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Voltar para o login'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  test('login pendente oferece confirmação e permite voltar sem guardar a senha', async () => {
    mockSignIn.mockRejectedValueOnce(new ApiError(403, 'Confirme seu e-mail.', 'EMAIL_NOT_VERIFIED'));
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'nova@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'SenhaNova123!');
    fireEvent.press(screen.getByText('Entrar'));

    await screen.findByTestId('verification-pending');
    expect(screen.getByText('nova@example.com')).toBeTruthy();
    expect(screen.getByTestId('resend-verification').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByText('Voltar para o login'));
    expect(screen.getByTestId('login-email').props.value).toBe('nova@example.com');
    expect(screen.getByTestId('login-password').props.value).toBe('');
  });

  test('credenciais inválidas continuam no formulário, sem aviso de confirmação', async () => {
    mockSignIn.mockRejectedValueOnce(new ApiError(401, 'E-mail ou senha inválidos.'));
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'pessoa@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'SenhaIncorreta');
    fireEvent.press(screen.getByText('Entrar'));

    await screen.findByText('E-mail ou senha inválidos.');
    expect(screen.queryByTestId('verification-pending')).toBeNull();
    expect(screen.getByTestId('login-email').props.value).toBe('pessoa@example.com');
  });

  test('reenvio usa mensagem genérica e só permite outro pedido após 60 segundos', async () => {
    jest.useFakeTimers();
    render(<EmailVerificationNotice email="nova@example.com" onBackToLogin={jest.fn()} />);
    fireEvent.press(screen.getByText('Reenviar confirmação'));

    await screen.findByText('Se houver um cadastro pendente para este e-mail, enviaremos um novo link de confirmação.');
    expect(mockResendVerification).toHaveBeenCalledWith('nova@example.com');
    expect(screen.getByTestId('resend-verification').props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByText('Reenviar confirmação'));
    expect(mockResendVerification).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(60_000));
    fireEvent.press(screen.getByText('Reenviar confirmação'));
    await act(async () => {});
    expect(mockResendVerification).toHaveBeenCalledTimes(2);
  });

  test('falha no reenvio preserva o aviso e permite nova tentativa', async () => {
    mockResendVerification.mockRejectedValueOnce(new ApiError(503, 'Serviço de e-mail indisponível.'));
    render(<EmailVerificationNotice email="nova@example.com" onBackToLogin={jest.fn()} />);
    fireEvent.press(screen.getByText('Reenviar confirmação'));

    await screen.findByText('Serviço de e-mail indisponível.');
    expect(screen.getByText('nova@example.com')).toBeTruthy();
    expect(screen.getByTestId('resend-verification').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByText('Reenviar confirmação'));
    await screen.findByText('Se houver um cadastro pendente para este e-mail, enviaremos um novo link de confirmação.');
    expect(mockResendVerification).toHaveBeenCalledTimes(2);
  });
});
