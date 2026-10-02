import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
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
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      const response = await forgotPassword(email);
      if (__DEV__ && response.resetToken) {
        router.push({ pathname: '/(auth)/reset-password', params: { token: response.resetToken } });
        return;
      }
      setError('root', { message: 'A recuperação automática por e-mail ainda não está habilitada neste ambiente.' });
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Não foi possível registrar a solicitação.') });
    }
  });

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe o e-mail cadastrado para iniciar a redefinição.">
      <Card style={styles.notice}>
        <ThemedText variant="caption" color={colors.info}>
          O envio de e-mail está planejado para uma etapa posterior. No ambiente local, o app continua automaticamente com o token seguro devolvido pela API.
        </ThemedText>
      </Card>
      <View style={styles.form}>
        <Controller control={control} name="email" render={({ field }) => (
          <TextField testID="forgot-email" label="E-mail" placeholder="seu@email.com" keyboardType="email-address" autoComplete="email" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />
        )} />
        {errors.root?.message ? <ThemedText color={colors.danger} variant="caption">{errors.root.message}</ThemedText> : null}
        <Button title="Continuar" loading={isSubmitting} onPress={() => void onSubmit()} />
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
