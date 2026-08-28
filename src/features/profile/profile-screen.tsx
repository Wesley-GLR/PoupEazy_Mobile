import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View, type ViewStyle } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/auth-context';
import { Button, Card, ScreenContainer, TextField, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/format';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  phone: z.string().trim().max(30, 'Telefone muito longo.'),
});
const passwordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmation: z.string(),
}).refine((values) => values.password === values.confirmation, { path: ['confirmation'], message: 'As senhas não coincidem.' });

export default function ProfileScreen() {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: profile?.nome ?? '', phone: profile?.telefone ?? '' },
  });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmation: '' },
  });

  const saveProfile = profileForm.handleSubmit(async (values) => {
    try {
      await updateProfile({ nome: values.name.trim(), telefone: values.phone.trim() || null });
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos.');
    } catch (error) {
      profileForm.setError('root', { message: getErrorMessage(error) });
    }
  });
  const savePassword = passwordForm.handleSubmit(async ({ password }) => {
    try {
      await updatePassword(password);
      passwordForm.reset();
      Alert.alert('Senha atualizada', 'Use a nova senha no próximo acesso.');
    } catch (error) {
      passwordForm.setError('root', { message: getErrorMessage(error) });
    }
  });

  function confirmSignOut() {
    Alert.alert('Sair da conta?', 'A sessão segura deste aparelho será encerrada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <ScreenContainer keyboardAware>
      <Card>
        <ThemedText variant="heading">Dados pessoais</ThemedText>
        <TextField label="E-mail" value={user?.email ?? ''} editable={false} helperText="O e-mail não pode ser alterado por aqui." />
        <Controller control={profileForm.control} name="name" render={({ field }) => <TextField label="Nome" autoCapitalize="words" autoComplete="name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={profileForm.formState.errors.name?.message} />} />
        <Controller control={profileForm.control} name="phone" render={({ field }) => <TextField label="Telefone (opcional)" keyboardType="phone-pad" autoComplete="tel" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={profileForm.formState.errors.phone?.message} />} />
        {profileForm.formState.errors.root?.message ? <ThemedText color={colors.danger} variant="caption">{profileForm.formState.errors.root.message}</ThemedText> : null}
        <Button title="Salvar dados" loading={profileForm.formState.isSubmitting} onPress={() => void saveProfile()} />
      </Card>

      <Card>
        <ThemedText variant="heading">Alterar senha</ThemedText>
        <Controller control={passwordForm.control} name="password" render={({ field }) => <TextField label="Nova senha" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={passwordForm.formState.errors.password?.message} />} />
        <Controller control={passwordForm.control} name="confirmation" render={({ field }) => <TextField label="Confirmar nova senha" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={passwordForm.formState.errors.confirmation?.message} />} />
        {passwordForm.formState.errors.root?.message ? <ThemedText color={colors.danger} variant="caption">{passwordForm.formState.errors.root.message}</ThemedText> : null}
        <Button title="Atualizar senha" variant="secondary" loading={passwordForm.formState.isSubmitting} onPress={() => void savePassword()} />
      </Card>

      <View style={styles.signOut}>
        <Button title="Sair da conta" variant="destructive" onPress={confirmSignOut} />
      </View>
    </ScreenContainer>
  );
}

const styles = { signOut: { paddingTop: spacing.md } satisfies ViewStyle };
