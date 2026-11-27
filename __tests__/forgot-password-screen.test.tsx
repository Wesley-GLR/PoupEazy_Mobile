import { fireEvent, render, screen } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import ForgotPasswordScreen from '@/features/auth/forgot-password-screen';
import type { ForgotPasswordResponse } from '@/types/api';

const mockForgotPassword = jest.fn<Promise<ForgotPasswordResponse>, [string]>();

jest.mock('@/auth/auth-context', () => ({
  useAuth: () => ({ forgotPassword: mockForgotPassword }),
}));

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Link: ({ children }: PropsWithChildren) => <Text>{children}</Text> };
});

jest.mock('@/features/auth/auth-shell', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AuthShell: ({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) => (
      <View>
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
        {children}
      </View>
    ),
  };
});

describe('Recuperação de senha por e-mail', () => {
  beforeEach(() => {
    mockForgotPassword.mockReset();
    mockForgotPassword.mockResolvedValue({ message: 'Solicitação recebida.' });
  });

  test('confirma uma resposta sem token e orienta a concluir no navegador', async () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'pessoa@example.com');
    fireEvent.press(screen.getByText('Enviar link de recuperação'));

    await screen.findByTestId('forgot-request-sent');

    expect(mockForgotPassword).toHaveBeenCalledWith('pessoa@example.com');
    expect(screen.getByText('Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.')).toBeTruthy();
    expect(screen.getByText('Depois de definir a nova senha no site, volte ao app e faça login.')).toBeTruthy();
    expect(screen.queryByTestId('reset-password')).toBeNull();
    expect(screen.getByText('Voltar para o login')).toBeTruthy();
  });

  test('preserva o endereço após falha e permite tentar novamente', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Sem conexão.'));
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'pessoa@example.com');
    fireEvent.press(screen.getByText('Enviar link de recuperação'));

    await screen.findByText('Sem conexão.');

    expect(screen.getByTestId('forgot-email').props.value).toBe('pessoa@example.com');
    expect(screen.queryByTestId('forgot-request-sent')).toBeNull();

    fireEvent.press(screen.getByText('Enviar link de recuperação'));

    await screen.findByTestId('forgot-request-sent');
    expect(mockForgotPassword).toHaveBeenCalledTimes(2);
  });

  test('permite corrigir o e-mail depois da confirmação genérica', async () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'pessoa@example.com');
    fireEvent.press(screen.getByText('Enviar link de recuperação'));
    await screen.findByTestId('forgot-request-sent');

    fireEvent.press(screen.getByText('Usar outro e-mail'));

    expect(screen.getByTestId('forgot-email').props.value).toBe('pessoa@example.com');
    expect(screen.queryByTestId('forgot-request-sent')).toBeNull();
    expect(mockForgotPassword).toHaveBeenCalledTimes(1);
  });
});
