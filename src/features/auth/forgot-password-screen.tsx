import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, type ViewStyle } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/auth-context';
import { Button, Card, TextField, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/format';

import { AuthShell } from './auth-shell';

const schema = z.object({ email: z.email('Informe um e-mail válido.') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [requestSent, setRequestSent] = useState(false);
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPassword(email);
      setRequestSent(true);
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Não foi possível registrar a solicitação.') });
    }
  });

  if (requestSent) {
    return (
      <AuthShell title="Confira seu e-mail" subtitle="Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.">
        <Card style={styles.notice}>
          <ThemedText testID="forgot-request-sent" accessibilityLiveRegion="polite" color={colors.info}>
            Confira a caixa de entrada e a pasta de spam. O link abre o site do PoupEazy no navegador.
          </ThemedText>
        </Card>
        <ThemedText color={colors.textMuted}>
          Depois de definir a nova senha no site, volte ao app e faça login.
        </ThemedText>
        <ThemedText variant="caption" color={colors.textMuted}>
          Se precisar solicitar outro link, aguarde um minuto antes de tentar novamente.
        </ThemedText>
        <Button title="Usar outro e-mail" variant="secondary" onPress={() => setRequestSent(false)} />
        <Link href="/(auth)/login" style={styles.link}>Voltar para o login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu e-mail para receber um link de redefinição de senha.">
      <View style={styles.form}>
        <Controller control={control} name="email" render={({ field }) => (
          <TextField testID="forgot-email" label="E-mail" placeholder="seu@email.com" keyboardType="email-address" autoComplete="email" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />
        )} />
        {errors.root?.message ? <ThemedText selectable accessibilityLiveRegion="polite" color={colors.danger} variant="caption">{errors.root.message}</ThemedText> : null}
        <Button title="Enviar link de recuperação" loading={isSubmitting} onPress={() => void onSubmit()} />
      </View>
      <Link href="/(auth)/login" style={styles.link}>Voltar para o login</Link>
    </AuthShell>
  );
}

const styles = {
  notice: { backgroundColor: colors.infoSoft, borderColor: colors.info, padding: spacing.md } satisfies ViewStyle,
  form: { gap: spacing.lg } satisfies ViewStyle,
  link: { color: colors.primary, fontWeight: '600' as const, textAlign: 'center' as const },
};
