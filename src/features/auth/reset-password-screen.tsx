import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, type ViewStyle } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/auth-context';
import { Button, TextField, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/format';

import { AuthShell } from './auth-shell';

const schema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmation: z.string(),
}).refine((values) => values.password === values.confirmation, {
  path: ['confirmation'], message: 'As senhas não coincidem.',
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuth();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { password: '', confirmation: '' },
  });

  if (!token) {
    return (
      <AuthShell title="Link inválido" subtitle="O token de recuperação está ausente ou expirou.">
        <Link href="/(auth)/forgot-password" style={styles.link}>Solicitar uma nova redefinição</Link>
      </AuthShell>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      await resetPassword(token, password);
      router.replace('/(auth)/login');
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Não foi possível atualizar a senha.') });
    }
  });

  return (
    <AuthShell title="Nova senha" subtitle="Defina uma nova senha para acessar sua conta.">
      <View style={styles.form}>
        <Controller control={control} name="password" render={({ field }) => (
          <TextField testID="reset-password" label="Nova senha" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />
        )} />
        <Controller control={control} name="confirmation" render={({ field }) => (
          <TextField testID="reset-confirmation" label="Confirme a nova senha" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.confirmation?.message} />
        )} />
        {errors.root?.message ? <ThemedText color={colors.danger} variant="caption">{errors.root.message}</ThemedText> : null}
        <Button title="Salvar nova senha" loading={isSubmitting} onPress={() => void onSubmit()} />
      </View>
    </AuthShell>
  );
}

const styles = {
  form: { gap: spacing.lg } satisfies ViewStyle,
  link: { color: colors.primary, fontWeight: '600' as const, textAlign: 'center' as const },
};
