import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, type ViewStyle } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/auth-context';
import { Button, TextField, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/format';

import { AuthShell } from './auth-shell';

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  email: z.email('Informe um e-mail válido.'),
  phone: z.string().trim().max(30, 'Telefone muito longo.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmation: z.string(),
}).refine((values) => values.password === values.confirmation, {
  path: ['confirmation'], message: 'As senhas não coincidem.',
});
type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmation: '' },
  });

  const onSubmit = handleSubmit(async ({ name, email, phone, password }) => {
    try {
      await signUp({ nome: name, email, telefone: phone || undefined, password });
      router.replace('/(auth)/login');
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Não foi possível criar sua conta.') });
    }
  });

  return (
    <AuthShell title="Registre-se" subtitle="Crie sua conta e comece a economizar.">
      <View style={styles.form}>
        <Controller control={control} name="name" render={({ field }) => (
          <TextField testID="register-name" label="Nome completo" placeholder="Seu nome" autoCapitalize="words" autoComplete="name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.name?.message} />
        )} />
        <Controller control={control} name="email" render={({ field }) => (
          <TextField testID="register-email" label="E-mail" placeholder="seu@email.com" keyboardType="email-address" autoComplete="email" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />
        )} />
        <Controller control={control} name="phone" render={({ field }) => (
          <TextField label="Telefone (opcional)" placeholder="(31) 99999-9999" keyboardType="phone-pad" autoComplete="tel" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.phone?.message} />
        )} />
        <Controller control={control} name="password" render={({ field }) => (
          <TextField testID="register-password" label="Senha" placeholder="Mínimo de 6 caracteres" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />
        )} />
        <Controller control={control} name="confirmation" render={({ field }) => (
          <TextField testID="register-confirmation" label="Confirme a senha" placeholder="Digite novamente" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.confirmation?.message} />
        )} />
        {errors.root?.message ? <ThemedText color={colors.danger} variant="caption">{errors.root.message}</ThemedText> : null}
        <Button title="Criar conta" loading={isSubmitting} onPress={() => void onSubmit()} />
      </View>
      <ThemedText variant="caption" color={colors.textMuted} style={styles.center}>
        Já tem conta? <Link href="/(auth)/login" style={styles.link}>Faça login</Link>
      </ThemedText>
    </AuthShell>
  );
}

const styles = {
  form: { gap: spacing.md } satisfies ViewStyle,
  center: { textAlign: 'center' as const },
  link: { color: colors.primary, fontWeight: '700' as const },
};
