import { Button, Card, ThemedText } from '@/components/ui';
import { colors } from '@/theme';

import { AuthShell } from './auth-shell';
import { useEmailVerification } from './use-email-verification';

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
  const { resending, message, error, remainingSeconds, resendEmail } = useEmailVerification(email, initialCooldownSeconds);

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
