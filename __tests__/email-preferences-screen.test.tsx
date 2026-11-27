import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/api/client';
import EmailPreferencesScreen from '@/features/preferences/email-preferences-screen';

type Preferences = {
  alerta_orcamento_ativo: boolean;
  alerta_orcamento_percentual: number;
  alerta_despesa_ativo: boolean;
  alerta_despesa_valor_minimo: number;
  alerta_receita_ativo: boolean;
  alerta_receita_valor_minimo: number;
  alerta_meta_concluida_ativo: boolean;
  email_verificado: boolean;
};
type EditablePreferences = Omit<Preferences, 'email_verificado'>;

const defaultEditablePreferences: EditablePreferences = {
  alerta_orcamento_ativo: false,
  alerta_orcamento_percentual: 80,
  alerta_despesa_ativo: false,
  alerta_despesa_valor_minimo: 100,
  alerta_receita_ativo: false,
  alerta_receita_valor_minimo: 100,
  alerta_meta_concluida_ativo: false,
};
const defaultPreferences: Preferences = {
  ...defaultEditablePreferences,
  email_verificado: true,
};
const mockRefetch = jest.fn();
const mockMutateAsync = jest.fn<Promise<Preferences>, [EditablePreferences]>();
const mockResendVerification = jest.fn();
const mockSignOut = jest.fn();
const mockQuery = {
  data: { ...defaultPreferences },
  isLoading: false,
  isError: false,
  isFetching: false,
  isRefetching: false,
  isSuccess: true,
  status: 'success',
  fetchStatus: 'idle',
  error: null,
  refetch: mockRefetch,
};
let mockFocusCallback: (() => unknown) | undefined;

jest.mock('@/api/hooks', () => ({
  useEmailPreferences: () => mockQuery,
  useUpdateEmailPreferences: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));
jest.mock('@/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'preferences-user', email: 'pessoa@example.com' },
    resendVerification: mockResendVerification,
    signOut: mockSignOut,
  }),
}));
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/auth/token-storage', () => ({ getSessionToken: jest.fn(), clearSessionToken: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => unknown) => { mockFocusCallback = effect; },
}));
jest.mock('@expo/ui', () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Host: ({ children }: PropsWithChildren) => <View>{children}</View>,
    Switch: ({ label, value, onValueChange, disabled, testID }: {
      label?: string;
      value: boolean;
      onValueChange: (value: boolean) => void;
      disabled?: boolean;
      testID?: string;
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={() => onValueChange(!value)}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

function changePercentage(value: string) {
  fireEvent.changeText(screen.getByTestId('email-budget-alerts-percent'), value);
}

function changeExpenseMinimum(value: string) {
  fireEvent.changeText(screen.getByTestId('email-expense-alerts-minimum'), value);
}

function changeIncomeMinimum(value: string) {
  fireEvent.changeText(screen.getByTestId('email-income-alerts-minimum'), value);
}

describe('Preferências de e-mail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = undefined;
    Object.assign(mockQuery, {
      data: { ...defaultPreferences }, isLoading: false, isError: false,
      isFetching: false, isRefetching: false, isSuccess: true,
      status: 'success', fetchStatus: 'idle', error: null,
    });
    mockRefetch.mockResolvedValue({ data: { ...defaultPreferences } });
    mockMutateAsync.mockImplementation(async (input) => ({ ...input, email_verificado: mockQuery.data.email_verificado }));
    mockResendVerification.mockResolvedValue({ message: 'Solicitação recebida.' });
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  test('carrega todos os alertas desligados e os limites padrão sem salvar automaticamente', async () => {
    render(<EmailPreferencesScreen />);

    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-budget-alerts-percent').props.value).toBe('80');
    expect(screen.getByTestId('email-expense-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-income-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-goal-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-expense-alerts-minimum').props.value).toBe('100,00');
    expect(screen.getByTestId('email-income-alerts-minimum').props.value).toBe('100,00');
    expect(screen.getByDisplayValue('pessoa@example.com').props.editable).toBe(false);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test.each(['0', '101', '1.5', ''])('rejeita percentual inválido %j antes de enviar', async (value) => {
    render(<EmailPreferencesScreen />);
    changePercentage(value);
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Informe um número inteiro de 1 a 100.');
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByText('Preferências salvas.')).toBeNull();
  });

  test.each(['1', '100'])('aceita o limite %s e envia percentual como número inteiro', async (value) => {
    render(<EmailPreferencesScreen />);
    changePercentage(value);
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Preferências salvas.');
    expect(mockMutateAsync).toHaveBeenCalledWith({
      ...defaultEditablePreferences,
      alerta_orcamento_percentual: Number(value),
    });
  });

  test.each([
    ['email-budget-alerts-switch', 'alerta_orcamento_ativo'],
    ['email-expense-alerts-switch', 'alerta_despesa_ativo'],
    ['email-income-alerts-switch', 'alerta_receita_ativo'],
    ['email-goal-alerts-switch', 'alerta_meta_concluida_ativo'],
  ] as const)('ativar %s mantém os outros alertas desligados', async (testID, field) => {
    render(<EmailPreferencesScreen />);
    fireEvent.press(screen.getByTestId(testID));
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Preferências salvas.');
    expect(mockMutateAsync).toHaveBeenCalledWith({ ...defaultEditablePreferences, [field]: true });
  });

  test('salva mínimos brasileiros distintos de despesa e receita sem perder casas decimais', async () => {
    render(<EmailPreferencesScreen />);
    fireEvent.press(screen.getByTestId('email-expense-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-income-alerts-switch'));
    changeExpenseMinimum('100,50');
    changeIncomeMinimum('1.234,56');
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Preferências salvas.');
    expect(mockMutateAsync).toHaveBeenCalledWith({
      ...defaultEditablePreferences,
      alerta_despesa_ativo: true,
      alerta_despesa_valor_minimo: 100.5,
      alerta_receita_ativo: true,
      alerta_receita_valor_minimo: 1234.56,
    });
  });

  test.each([
    ['0,01', 0.01],
    ['9.999.999.999,99', 9999999999.99],
  ] as const)('aceita o limite monetário %s sem arredondamento silencioso', async (value, expected) => {
    render(<EmailPreferencesScreen />);
    changeExpenseMinimum(value);
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Preferências salvas.');
    expect(mockMutateAsync).toHaveBeenCalledWith({
      ...defaultEditablePreferences, alerta_despesa_valor_minimo: expected,
    });
  });

  test.each([
    ['email-expense-alerts-minimum', '1,234'],
    ['email-expense-alerts-minimum', '0'],
    ['email-expense-alerts-minimum', '100.001'],
    ['email-expense-alerts-minimum', '10.000.000.000,00'],
    ['email-expense-alerts-minimum', ''],
    ['email-income-alerts-minimum', '1,234'],
    ['email-income-alerts-minimum', '100.001'],
  ] as const)('não reinterpreta valor monetário inválido em %s: %j', async (testID, value) => {
    render(<EmailPreferencesScreen />);
    fireEvent.changeText(screen.getByTestId(testID), value);
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Informe um valor de R$ 0,01 a R$ 9.999.999.999,99, com até duas casas decimais.');
    expect(screen.getByTestId(testID).props.value).toBe(value);
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByText('Preferências salvas.')).toBeNull();
  });

  test('falha ao salvar preserva as mudanças e a sessão para tentar novamente', async () => {
    mockMutateAsync.mockRejectedValueOnce(new ApiError(503, 'Servidor indisponível.'));
    render(<EmailPreferencesScreen />);
    fireEvent.press(screen.getByTestId('email-budget-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-expense-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-goal-alerts-switch'));
    changePercentage('65');
    changeExpenseMinimum('100,50');
    changeIncomeMinimum('1.234,56');
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Servidor indisponível.');
    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('email-budget-alerts-percent').props.value).toBe('65');
    expect(screen.getByTestId('email-expense-alerts-switch').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('email-income-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-goal-alerts-switch').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('email-expense-alerts-minimum').props.value).toBe('100,50');
    expect(screen.getByTestId('email-income-alerts-minimum').props.value).toBe('1.234,56');
    expect(mockSignOut).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Salvar preferências'));
    await screen.findByText('Preferências salvas.');
    expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    expect(mockMutateAsync).toHaveBeenLastCalledWith({
      ...defaultEditablePreferences,
      alerta_orcamento_ativo: true,
      alerta_orcamento_percentual: 65,
      alerta_despesa_ativo: true,
      alerta_despesa_valor_minimo: 100.5,
      alerta_receita_valor_minimo: 1234.56,
      alerta_meta_concluida_ativo: true,
    });
  });

  test('refetch mantém o rascunho e Cancelar recupera os valores atuais do servidor', async () => {
    const { rerender } = render(<EmailPreferencesScreen />);
    fireEvent.press(screen.getByTestId('email-budget-alerts-switch'));
    changePercentage('65');
    changeExpenseMinimum('200,50');
    mockQuery.data = { ...defaultPreferences, alerta_orcamento_percentual: 90, alerta_despesa_valor_minimo: 300 };

    rerender(<EmailPreferencesScreen />);

    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('email-budget-alerts-percent').props.value).toBe('65');
    expect(screen.getByTestId('email-expense-alerts-minimum').props.value).toBe('200,50');
    expect(mockMutateAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.getByTestId('email-budget-alerts-percent').props.value).toBe('90'));
    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-expense-alerts-minimum').props.value).toBe('300,00');
  });

  test('conta não confirmada não ativa alertas e pode solicitar confirmação sem sair', async () => {
    jest.useFakeTimers();
    mockQuery.data = { ...defaultPreferences, email_verificado: false };
    render(<EmailPreferencesScreen />);

    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('email-expense-alerts-switch').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('email-income-alerts-switch').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('email-goal-alerts-switch').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('email-budget-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-expense-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-income-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-goal-alerts-switch'));
    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-expense-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-income-alerts-switch').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('email-goal-alerts-switch').props.accessibilityState.checked).toBe(false);

    fireEvent.press(screen.getByText('Enviar link de confirmação'));
    await waitFor(() => expect(mockResendVerification).toHaveBeenCalledWith('pessoa@example.com'));
    await act(async () => {});
    fireEvent.press(screen.getByText('Enviar link de confirmação'));
    expect(mockResendVerification).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test('permite desligar alertas mesmo se o e-mail não estiver confirmado', async () => {
    mockQuery.data = {
      ...defaultPreferences, alerta_orcamento_ativo: true,
      alerta_despesa_ativo: true, alerta_receita_ativo: true,
      alerta_meta_concluida_ativo: true, email_verificado: false,
    };
    render(<EmailPreferencesScreen />);
    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByTestId('email-budget-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-expense-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-income-alerts-switch'));
    fireEvent.press(screen.getByTestId('email-goal-alerts-switch'));
    fireEvent.press(screen.getByText('Salvar preferências'));

    await screen.findByText('Preferências salvas.');
    expect(mockMutateAsync).toHaveBeenCalledWith(defaultEditablePreferences);
  });

  test('atualiza ao voltar para a tela e depois de confirmar no navegador', async () => {
    mockQuery.data = { ...defaultPreferences, email_verificado: false };
    const { rerender } = render(<EmailPreferencesScreen />);
    act(() => { mockFocusCallback?.(); });
    expect(mockRefetch).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Já confirmei, atualizar'));
    expect(mockRefetch.mock.calls.length).toBeGreaterThanOrEqual(2);

    mockQuery.data = { ...defaultPreferences, email_verificado: true };
    rerender(<EmailPreferencesScreen />);
    expect(screen.getByTestId('email-budget-alerts-switch').props.accessibilityState.disabled).toBe(false);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
