import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { Button, Card, ThemedText } from '@/components/ui';
import { colors } from '@/theme';
import { getErrorMessage } from '@/utils/format';

import { AuthShell } from './auth-shell';

type EmailVerificationNoticeProps = {
  email: string;
  onBackToLogin: () => void;
  initialCooldownSeconds?: number;
};

export function EmailVerificationNotice({
  email,
  onBackToLogin,
  initialCooldownSeconds = 0,
}: EmailVerificationNoticeProps) {
  const { resendVerification } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [resendAvailableAt, setResendAvailableAt] = useState(() => Date.now() + initialCooldownSeconds * 1000);
  const remainingSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  useEffect(() => {
    if (resendAvailableAt <= Date.now()) return;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= resendAvailableAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);

  async function resendEmail() {
    if (resending || remainingSeconds) return;
    setResending(true);
    setMessage(null);
    setError(null);
    try {
      await resendVerification(email);
      setMessage('Se houver um cadastro pendente para este e-mail, enviaremos um novo link de confirmação.');
      const requestedAt = Date.now();
      setNow(requestedAt);
      setResendAvailableAt(requestedAt + 60_000);
    } catch (failure) {
      setError(getErrorMessage(failure, 'Não foi possível solicitar outro link. Tente novamente.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Confirme seu e-mail" subtitle="Confirme o cadastro pelo link enviado por e-mail antes de acessar sua nova conta.">
      <Card accessibilityLabel="Confirmação de cadastro pendente">
        <ThemedText testID="verification-pending" accessibilityLiveRegion="polite">
          Confira a caixa de entrada e a pasta de spam de:
        </ThemedText>
        <ThemedText selectable variant="label">{email}</ThemedText>
        <ThemedText color={colors.textMuted}>
          Abra o link do e-mail e confirme seu cadastro no site do PoupEazy. Depois, volte ao app para fazer login.
        </ThemedText>
      </Card>
      {message ? <ThemedText selectable accessibilityLiveRegion="polite" color={colors.success}>{message}</ThemedText> : null}
      {error ? <ThemedText selectable accessibilityLiveRegion="polite" color={colors.danger}>{error}</ThemedText> : null}
      <Button
        testID="resend-verification"
        title="Reenviar confirmação"
        variant="secondary"
        loading={resending}
        disabled={remainingSeconds > 0}
        onPress={() => void resendEmail()}
      />
      {remainingSeconds > 0 ? (
        <ThemedText variant="caption" color={colors.textMuted}>
          Aguarde {remainingSeconds}s para solicitar outro link.
        </ThemedText>
      ) : null}
      <Button testID="verification-back-to-login" title="Voltar para o login" onPress={onBackToLogin} />
    </AuthShell>
  );
}
