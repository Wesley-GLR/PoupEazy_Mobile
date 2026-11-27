import { Host, Switch } from '@expo/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, type ViewStyle } from 'react-native';
import { z } from 'zod';

import { ApiError } from '@/api/client';
import { useEmailPreferences, useUpdateEmailPreferences } from '@/api/hooks';
import { useAuth } from '@/auth/auth-context';
import { Button, Card, ErrorState, LoadingState, ScreenContainer, TextField, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { EmailPreferences } from '@/types/api';
import { getErrorMessage } from '@/utils/format';

import { useEmailVerification } from '../auth/use-email-verification';
import { parseAlertAmount } from './parse-alert-amount';

const amountSchema = z.string().refine(
  (value) => Number.isFinite(parseAlertAmount(value)),
  'Informe um valor de R$ 0,01 a R$ 9.999.999.999,99, com até duas casas decimais.',
);

const schema = z.object({
  active: z.boolean(),
  percentage: z.string().trim().regex(/^\d+$/, 'Informe um número inteiro de 1 a 100.').refine(
    (value) => Number(value) >= 1 && Number(value) <= 100,
    'Informe um número inteiro de 1 a 100.',
  ),
  expenseActive: z.boolean(),
  expenseMinimum: amountSchema,
  incomeActive: z.boolean(),
  incomeMinimum: amountSchema,
  goalCompletedActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const formValues = (preferences: EmailPreferences): FormValues => ({
  active: preferences.alerta_orcamento_ativo,
  percentage: String(preferences.alerta_orcamento_percentual),
  expenseActive: preferences.alerta_despesa_ativo,
  expenseMinimum: preferences.alerta_despesa_valor_minimo.toFixed(2).replace('.', ','),
  incomeActive: preferences.alerta_receita_ativo,
  incomeMinimum: preferences.alerta_receita_valor_minimo.toFixed(2).replace('.', ','),
  goalCompletedActive: preferences.alerta_meta_concluida_ativo,
});

export default function EmailPreferencesScreen() {
  const { user } = useAuth();
  const preferencesQuery = useEmailPreferences();
  const update = useUpdateEmailPreferences();
  const verification = useEmailVerification(user?.email ?? '');
  const [saved, setSaved] = useState(false);
  const { control, handleSubmit, reset, setError, clearErrors, formState: { errors, isDirty, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: false, percentage: '80', expenseActive: false, expenseMinimum: '100,00',
      incomeActive: false, incomeMinimum: '100,00', goalCompletedActive: false,
    },
  });
  const { data: preferences, refetch } = preferencesQuery;
  const verified = preferences?.email_verificado === true;
  const busy = isSubmitting || update.isPending;

  useFocusEffect(useCallback(() => {
    void refetch();
  }, [refetch]));

  useEffect(() => {
    if (preferences && !isDirty && !isSubmitting) reset(formValues(preferences));
  }, [preferences, isDirty, isSubmitting, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if ((values.active || values.expenseActive || values.incomeActive || values.goalCompletedActive) && !verified) {
      setError('root', { message: 'Confirme seu e-mail antes de ativar os alertas.' });
      return;
    }
    setSaved(false);
    try {
      const updated = await update.mutateAsync({
        alerta_orcamento_ativo: values.active,
        alerta_orcamento_percentual: Number(values.percentage),
        alerta_despesa_ativo: values.expenseActive,
        alerta_despesa_valor_minimo: parseAlertAmount(values.expenseMinimum),
        alerta_receita_ativo: values.incomeActive,
        alerta_receita_valor_minimo: parseAlertAmount(values.incomeMinimum),
        alerta_meta_concluida_ativo: values.goalCompletedActive,
      });
      reset(formValues(updated));
      setSaved(true);
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === 'EMAIL_NOT_VERIFIED') {
        setError('root', { message: 'Confirme seu e-mail antes de ativar os alertas.' });
        void refetch();
      } else {
        setError('root', { message: getErrorMessage(failure, 'Não foi possível salvar suas preferências. Tente novamente.') });
      }
    }
  });

  if (!preferences) {
    if (preferencesQuery.isError || preferencesQuery.fetchStatus === 'paused') {
      return <ErrorState message="Não foi possível carregar suas preferências. Confira a conexão e tente novamente." onRetry={() => void refetch()} />;
    }
    return <LoadingState message="Carregando preferências de e-mail…" />;
  }

  return (
    <ScreenContainer keyboardAware>
      <Card>
        <ThemedText variant="heading">Envio de e-mails</ThemedText>
        <TextField label="E-mail de recebimento" value={user?.email ?? ''} editable={false} helperText="Os avisos são enviados para o e-mail da sua conta." />
        <ThemedText variant="caption" color={verified ? colors.success : colors.textMuted}>
          {verified ? 'E-mail confirmado.' : 'Confirme seu e-mail para ativar os alertas.'}
        </ThemedText>
      </Card>

      <Card>
        <ThemedText variant="heading">Orçamento mensal</ThemedText>
        <Controller control={control} name="active" render={({ field }) => (
          <PreferenceSwitch
            testID="email-budget-alerts-switch"
            label="Receber alertas de orçamento"
            value={field.value}
            disabled={busy || (!verified && !field.value)}
            onValueChange={(value) => { field.onChange(value); clearErrors('root'); setSaved(false); }}
          />
        )} />
        <Controller control={control} name="percentage" render={({ field }) => (
          <TextField
            testID="email-budget-alerts-percent"
            label="Avisar ao atingir (%)"
            keyboardType="number-pad"
            maxLength={3}
            editable={!busy}
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={(value) => { field.onChange(value); setSaved(false); }}
            error={errors.percentage?.message}
            helperText="Escolha um número inteiro de 1 a 100. Esse percentual será usado enquanto os alertas estiverem ativados."
          />
        )} />
        <ThemedText color={colors.textMuted}>
          Um aviso ao atingir o percentual escolhido e outro ao ultrapassar 100% do orçamento. Se os dois limites forem atingidos juntos, enviamos um único aviso.
        </ThemedText>
        <ThemedText color={colors.textMuted}>
          Cada aviso é enviado no máximo uma vez por mês. Alterar o percentual ou desligar e ligar os alertas não reinicia os avisos daquele mês.
        </ThemedText>
        <ThemedText color={colors.textMuted}>
          Consideramos apenas o orçamento do mês atual, no horário de Brasília, e as despesas confirmadas. Receitas não reduzem o consumo do orçamento. Aportes em metas entram como despesas.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText variant="heading">Despesas registradas</ThemedText>
        <Controller control={control} name="expenseActive" render={({ field }) => (
          <PreferenceSwitch
            testID="email-expense-alerts-switch"
            label="Receber alertas de despesas"
            value={field.value}
            disabled={busy || (!verified && !field.value)}
            onValueChange={(value) => { field.onChange(value); clearErrors('root'); setSaved(false); }}
          />
        )} />
        <Controller control={control} name="expenseMinimum" render={({ field }) => (
          <TextField
            testID="email-expense-alerts-minimum"
            label="Avisar despesas a partir de (R$)"
            keyboardType="decimal-pad"
            maxLength={20}
            editable={!busy}
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={(value) => { field.onChange(value); setSaved(false); }}
            error={errors.expenseMinimum?.message}
            helperText="Exemplo: 100,00. Despesas confirmadas de valor igual ou acima do limite escolhido."
          />
        )} />
      </Card>

      <Card>
        <ThemedText variant="heading">Receitas registradas</ThemedText>
        <Controller control={control} name="incomeActive" render={({ field }) => (
          <PreferenceSwitch
            testID="email-income-alerts-switch"
            label="Receber alertas de receitas"
            value={field.value}
            disabled={busy || (!verified && !field.value)}
            onValueChange={(value) => { field.onChange(value); clearErrors('root'); setSaved(false); }}
          />
        )} />
        <Controller control={control} name="incomeMinimum" render={({ field }) => (
          <TextField
            testID="email-income-alerts-minimum"
            label="Avisar receitas a partir de (R$)"
            keyboardType="decimal-pad"
            maxLength={20}
            editable={!busy}
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={(value) => { field.onChange(value); setSaved(false); }}
            error={errors.incomeMinimum?.message}
            helperText="Exemplo: 100,00. Receitas confirmadas de valor igual ou acima do limite escolhido."
          />
        )} />
      </Card>

      <Card>
        <ThemedText variant="heading">Metas concluídas</ThemedText>
        <Controller control={control} name="goalCompletedActive" render={({ field }) => (
          <PreferenceSwitch
            testID="email-goal-alerts-switch"
            label="Receber alertas de metas concluídas"
            value={field.value}
            disabled={busy || (!verified && !field.value)}
            onValueChange={(value) => { field.onChange(value); clearErrors('root'); setSaved(false); }}
          />
        )} />
        <ThemedText color={colors.textMuted}>
          Um aviso quando uma meta atingir o valor planejado ou for marcada como concluída, no máximo uma vez por meta.
        </ThemedText>
      </Card>

      {!verified ? (
        <Card>
          <ThemedText variant="heading">Confirme seu e-mail</ThemedText>
          <ThemedText color={colors.textMuted}>
            Sua conta continua acessível. Para receber alertas, solicite o link e confira a caixa de entrada e a pasta de spam. Abra o link no navegador, confirme no site e depois volte a esta tela.
          </ThemedText>
          {verification.message ? <ThemedText selectable color={colors.success} accessibilityLiveRegion="polite">{verification.message}</ThemedText> : null}
          {verification.error ? <ThemedText selectable color={colors.danger} accessibilityLiveRegion="polite">{verification.error}</ThemedText> : null}
          <Button
            title="Enviar link de confirmação"
            variant="secondary"
            loading={verification.resending}
            disabled={verification.remainingSeconds > 0 || busy}
            onPress={() => void verification.resendEmail()}
          />
          {verification.remainingSeconds > 0 ? <ThemedText variant="caption" color={colors.textMuted}>Aguarde {verification.remainingSeconds}s para solicitar outro link.</ThemedText> : null}
          <Button title="Já confirmei, atualizar" variant="ghost" loading={preferencesQuery.isFetching} onPress={() => void refetch()} />
        </Card>
      ) : null}

      <Card>
        <ThemedText variant="heading">Novos registros</ThemedText>
        <ThemedText color={colors.textMuted}>
          Os alertas de despesas e receitas acompanham novos lançamentos confirmados registrados no PoupEazy, inclusive importações. Cada lançamento gera no máximo um aviso do seu tipo.
        </ThemedText>
        <ThemedText color={colors.textMuted}>
          Ativar os alertas de lançamentos e metas não envia avisos sobre registros anteriores à ativação. Você pode configurar cada tipo de aviso separadamente.
        </ThemedText>
        {preferencesQuery.isError ? <ThemedText selectable color={colors.warning} accessibilityLiveRegion="polite">Não foi possível atualizar as preferências. Seus dados preenchidos foram mantidos.</ThemedText> : null}
        {errors.root?.message ? <ThemedText selectable color={colors.danger} accessibilityLiveRegion="polite">{errors.root.message}</ThemedText> : null}
        {saved ? <ThemedText color={colors.success} accessibilityLiveRegion="polite">Preferências salvas.</ThemedText> : null}
        <View style={styles.actions}>
          <Button title="Salvar preferências" disabled={!isDirty || busy} loading={busy} onPress={() => void onSubmit()} />
          <Button title="Cancelar" variant="ghost" disabled={!isDirty || busy} onPress={() => { reset(formValues(preferences)); setSaved(false); }} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

function PreferenceSwitch(props: ComponentProps<typeof Switch>) {
  return (
    <Host matchContents={{ vertical: true }} seedColor={colors.primary} style={styles.switchHost}>
      <Switch {...props} />
    </Host>
  );
}

const styles = {
  switchHost: { width: '100%' } satisfies ViewStyle,
  actions: { gap: spacing.sm } satisfies ViewStyle,
};
