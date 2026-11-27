import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/api/client';
import ReportsScreen from '@/features/reports/reports-screen';
import type { ReportEmailInput, ReportEmailResponse } from '@/types/api';

const mockSend = jest.fn<Promise<ReportEmailResponse>, [ReportEmailInput]>();
const mockRefetch = jest.fn();
const mockResendVerification = jest.fn();
const mockSignOut = jest.fn();
const mockSetCustomPeriod = jest.fn();
const mockAccount = { data: { user: { id: 'reports-user', email: 'pessoa@example.com', email_verificado: true }, profile: null }, isError: false, isFetching: false, fetchStatus: 'idle', refetch: mockRefetch };
let mockFocus: (() => unknown) | undefined;
let mockSelectedDate = '2026-11-02';

jest.mock('@/api/hooks', () => ({
  useReportAccount: () => mockAccount,
  useSendEmailReport: () => ({ mutateAsync: mockSend, isPending: false }),
}));
jest.mock('@/auth/auth-context', () => ({ useAuth: () => ({ user: mockAccount.data.user, resendVerification: mockResendVerification, signOut: mockSignOut }) }));
jest.mock('@/state/period-context', () => ({ usePeriod: () => ({ startDate: '2026-11-01', endDate: '2026-11-30', setCustomPeriod: mockSetCustomPeriod }) }));
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/auth/token-storage', () => ({ getSessionToken: jest.fn(), clearSessionToken: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => ({ useFocusEffect: (effect: () => unknown) => { mockFocus = effect; } }));
jest.mock('@expo/ui', () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Host: ({ children }: PropsWithChildren) => <View>{children}</View>,
    Checkbox: ({ label, value, disabled, testID, onValueChange }: { label: string; value: boolean; disabled?: boolean; testID: string; onValueChange: (value: boolean) => void }) => (
      <Pressable testID={testID} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: value, disabled: Boolean(disabled) }} disabled={disabled} onPress={() => onValueChange(!value)}><Text>{label}</Text></Pressable>
    ),
  };
});
jest.mock('@expo/ui/community/datetime-picker', () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return function Picker({ testID, timeZoneName, onValueChange }: { testID: string; timeZoneName: string; onValueChange: (event: unknown, date: Date) => void }) {
    return <View testID={testID}><Text>{timeZoneName}</Text><Pressable onPress={() => onValueChange({}, new Date(`${mockSelectedDate}T12:00:00Z`))}><Text>Selecionar data de teste</Text></Pressable></View>;
  };
});

const submit = () => fireEvent.press(screen.getByText('Enviar relatório por e-mail'));

describe('Relatórios modulares por e-mail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ message: 'Aceito pelo serviço.', retry_after_seconds: 60 });
    mockAccount.data = { user: { id: 'reports-user', email: 'pessoa@example.com', email_verificado: true }, profile: null };
    mockAccount.isError = false;
    mockRefetch.mockResolvedValue({ data: mockAccount.data });
    mockResendVerification.mockResolvedValue({ message: 'Solicitação recebida.' });
    mockSelectedDate = '2026-11-02';
  });

  afterEach(() => { cleanup(); jest.useRealTimers(); });

  test('usa o período selecionado e defaults resumo/categorias/PDF sem enviar automaticamente', () => {
    render(<ReportsScreen />);
    expect(screen.getByText('Data inicial: 01/11/2026')).toBeTruthy();
    expect(screen.getByText('Data final: 30/11/2026')).toBeTruthy();
    expect(screen.getByTestId('report-section-resumo').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('report-section-categorias').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('report-section-transacoes').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('report-format-pdf').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('report-format-csv').props.accessibilityState.checked).toBe(false);
    expect(screen.getByDisplayValue('pessoa@example.com').props.editable).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('altera período e módulos localmente, enviando somente as escolhas', async () => {
    render(<ReportsScreen />);
    fireEvent.press(screen.getByTestId('report-start-date'));
    expect(screen.getByText('UTC')).toBeTruthy();
    fireEvent.press(screen.getByText('Selecionar data de teste'));
    fireEvent.press(screen.getByTestId('report-section-resumo'));
    fireEvent.press(screen.getByTestId('report-section-transacoes'));
    fireEvent.press(screen.getByTestId('report-format-csv'));
    submit();

    await screen.findByText('Relatório enviado ao serviço de e-mail para pessoa@example.com. Confira a caixa de entrada e o spam.');
    expect(mockSend).toHaveBeenCalledWith({ data_inicio: '2026-11-02', data_fim: '2026-11-30', secoes: ['categorias', 'transacoes'], formatos: ['pdf', 'csv'] });
    expect(mockSetCustomPeriod).not.toHaveBeenCalled();
    expect(screen.getByTestId('report-cooldown')).toBeTruthy();
  });

  test.each(['sections', 'formats'])('exige escolha não vazia de %s', async (group) => {
    render(<ReportsScreen />);
    if (group === 'sections') {
      fireEvent.press(screen.getByTestId('report-section-resumo'));
      fireEvent.press(screen.getByTestId('report-section-categorias'));
    } else fireEvent.press(screen.getByTestId('report-format-pdf'));
    submit();
    await screen.findByText(group === 'sections' ? 'Selecione pelo menos uma seção.' : 'Selecione pelo menos um formato.');
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('limite rejeitado não trunca o pedido nem perde as escolhas', async () => {
    mockSend.mockRejectedValueOnce(new ApiError(422, 'Limite excedido.', 'REPORT_LIMIT_EXCEEDED'));
    render(<ReportsScreen />);
    fireEvent.press(screen.getByTestId('report-section-metas'));
    submit();
    await screen.findByText(/O relatório ultrapassou os limites/);
    expect(screen.getByTestId('report-section-metas').props.accessibilityState.checked).toBe(true);
    expect(mockSend.mock.calls[0][0].data_inicio).toBe('2026-11-01');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test('resultado de envio incerto aguarda 60s e não repete automaticamente', async () => {
    jest.useFakeTimers();
    mockSend.mockRejectedValueOnce(new ApiError(408, 'Tempo excedido.', 'REQUEST_TIMEOUT'));
    render(<ReportsScreen />);
    fireEvent.press(screen.getByTestId('report-format-csv'));
    submit();
    await screen.findByText(/Não foi possível confirmar o envio/);
    expect(screen.getByTestId('report-format-csv').props.accessibilityState.checked).toBe(true);
    submit();
    expect(mockSend).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(60_000));
    expect(mockSend).toHaveBeenCalledTimes(1);
    submit();
    await screen.findByText(/Relatório enviado ao serviço/);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  test('cooldown usa o intervalo retornado na resposta de erro', async () => {
    mockSend.mockRejectedValueOnce(new ApiError(429, 'Aguarde.', 'REPORT_COOLDOWN', undefined, 37));
    render(<ReportsScreen />);
    submit();
    await screen.findByText(/Já existe um envio em andamento/);
    expect(screen.getByText('Aguarde 37s antes de solicitar outro relatório.')).toBeTruthy();
  });

  test('confirmação de conta antiga e retorno de foco preservam o rascunho e a sessão', async () => {
    mockAccount.data.user.email_verificado = false;
    const { rerender } = render(<ReportsScreen />);
    fireEvent.press(screen.getByTestId('report-format-csv'));
    submit();
    expect(mockSend).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Enviar link de confirmação'));
    await screen.findByText('Se houver um cadastro pendente para este e-mail, enviaremos um novo link de confirmação.');
    expect(mockResendVerification).toHaveBeenCalledWith('pessoa@example.com');
    mockAccount.data = { ...mockAccount.data, user: { ...mockAccount.data.user, email_verificado: true } };
    act(() => { mockFocus?.(); });
    rerender(<ReportsScreen />);
    expect(screen.getByTestId('report-format-csv').props.accessibilityState.checked).toBe(true);
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
    submit();
    await screen.findByText(/Relatório enviado ao serviço/);
  });

  test('negação de confirmação no POST atualiza o estado sem logout ou perda das escolhas', async () => {
    mockSend.mockRejectedValueOnce(new ApiError(403, 'Confirme seu e-mail.', 'EMAIL_NOT_VERIFIED'));
    mockRefetch.mockImplementation(async () => {
      mockAccount.data = { ...mockAccount.data, user: { ...mockAccount.data.user, email_verificado: false } };
      return { data: mockAccount.data };
    });
    render(<ReportsScreen />);
    fireEvent.press(screen.getByTestId('report-section-metas'));
    submit();
    await screen.findByText('Confirme seu e-mail antes de solicitar o relatório.');
    expect(mockRefetch).toHaveBeenCalled();
    expect(screen.getByTestId('report-section-metas').props.accessibilityState.checked).toBe(true);
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
