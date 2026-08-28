import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, type ViewStyle } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/auth-context';
import { Button, TextField, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/format';

import { AuthShell } from './auth-shell';

const schema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'E-mail ou senha incorretos.') });
    }
  });

  return (
    <AuthShell title="Entre" subtitle="Acesse sua conta e cuide das suas finanças.">
      <View style={styles.form}>
        <Controller control={control} name="email" render={({ field }) => (
          <TextField
            label="E-mail"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={errors.email?.message}
          />
        )} />
        <Controller control={control} name="password" render={({ field }) => (
          <TextField
            label="Senha"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            onSubmitEditing={() => void onSubmit()}
            error={errors.password?.message}
          />
        )} />
        <Link href="/(auth)/forgot-password" style={styles.forgot}>Esqueci minha senha</Link>
        {errors.root?.message ? (
          <ThemedText accessibilityLiveRegion="polite" color={colors.danger} variant="caption">
            {errors.root.message}
          </ThemedText>
        ) : null}
        <Button title="Entrar" loading={isSubmitting} onPress={() => void onSubmit()} />
      </View>
      <ThemedText variant="caption" color={colors.textMuted} style={styles.center}>
        Não tem conta? <Link href="/(auth)/register" style={styles.link}>Cadastre-se</Link>
      </ThemedText>
    </AuthShell>
  );
}

const styles = {
  form: { gap: spacing.lg } satisfies ViewStyle,
  forgot: { color: colors.primary, fontSize: 13, fontWeight: '600' as const, alignSelf: 'flex-end' as const },
  center: { textAlign: 'center' as const },
  link: { color: colors.primary, fontWeight: '700' as const },
};
