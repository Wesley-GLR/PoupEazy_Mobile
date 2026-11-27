import { Checkbox, Host } from '@expo/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View, type ViewStyle } from 'react-native';

import { ApiError } from '@/api/client';
import { useReportAccount, useSendEmailReport } from '@/api/hooks';
import { useAuth } from '@/auth/auth-context';
import { DateRangeFields } from '@/components/date-range-fields';
import { Button, Card, ErrorState, LoadingState, ScreenContainer, TextField, ThemedText } from '@/components/ui';
import { usePeriod } from '@/state/period-context';
import { colors, spacing } from '@/theme';
import type { ReportEmailInput, ReportSection } from '@/types/api';

import { useEmailVerification } from '../auth/use-email-verification';
import { reportRequestSchema } from './report-form';

const sections: { value: ReportSection; label: string; description: string }[] = [
  { value: 'resumo', label: 'Resumo', description: 'Receitas, despesas e resultado dos lançamentos confirmados no período.' },
  { value: 'transacoes', label: 'Transações', description: 'Lista dos lançamentos confirmados do intervalo.' },
  { value: 'categorias', label: 'Categorias', description: 'Totais agrupados por categoria e tipo de lançamento.' },
  { value: 'orcamentos', label: 'Orçamentos', description: 'Planejado integral de cada mês comparado às despesas brutas apenas do intervalo escolhido, inclusive em meses parciais.' },
  { value: 'metas', label: 'Metas', description: 'Posição atual e aportes/retiradas no período. A posição atual não representa uma fotografia histórica do fim do intervalo.' },
];

export default function ReportsScreen() {
  const { user } = useAuth();
  const period = usePeriod();
  const [defaults] = useState<ReportEmailInput>(() => ({
    data_inicio: period.startDate, data_fim: period.endDate,
    secoes: ['resumo', 'categorias'], formatos: ['pdf'],
  }));
  const accountQuery = useReportAccount();
  const send = useSendEmailReport();
  const email = accountQuery.data?.user.email ?? user?.email ?? '';
  const verified = accountQuery.data?.user.email_verificado === true;
  const verification = useEmailVerification(email);
  const sending = useRef(false);
  const [message, setMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [now, setNow] = useState(Date.now);
  const [availableAt, setAvailableAt] = useState(0);
  const remainingSeconds = Math.max(0, Math.ceil((availableAt - now) / 1000));
  const { control, setValue, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReportEmailInput>({
    resolver: zodResolver(reportRequestSchema), defaultValues: defaults,
  });
  const startDate = useWatch({ control, name: 'data_inicio' });
  const endDate = useWatch({ control, name: 'data_fim' });
  const busy = isSubmitting || send.isPending;
  const { refetch } = accountQuery;

  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));

  useEffect(() => {
    if (availableAt <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= availableAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [availableAt]);

  function cooldown(seconds: unknown) {
    const wait = typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : 60;
    const current = Date.now();
    setNow(current);
    setAvailableAt(current + wait * 1000);
  }

  function edited() { setMessage(''); setRequestError(''); }

  async function onSubmit() {
    await handleSubmit(async (values) => {
      if (sending.current || remainingSeconds) return;
      if (!verified) { setRequestError('Confirme seu e-mail antes de solicitar o relatório.'); return; }
      sending.current = true;
      edited();
      try {
        const response = await send.mutateAsync(values);
        setMessage(`Relatório enviado ao serviço de e-mail para ${email}. Confira a caixa de entrada e o spam.`);
        cooldown(response.retry_after_seconds);
      } catch (failure) {
        if (failure instanceof ApiError && failure.code === 'EMAIL_NOT_VERIFIED') {
          setRequestError('Confirme seu e-mail antes de solicitar o relatório.');
          void refetch();
        } else if (failure instanceof ApiError && failure.status === 422) {
          setRequestError(failure.code === 'REPORT_LIMIT_EXCEEDED'
            ? 'O relatório ultrapassou os limites permitidos. Reduza o período ou as seções selecionadas; se houver mais de 200 metas, desmarque Metas.'
            : 'Confira o período, as seções e os formatos selecionados.');
        } else if (failure instanceof ApiError && failure.status === 429) {
          cooldown(failure.retryAfterSeconds);
          setRequestError('Já existe um envio em andamento ou um pedido recente. Aguarde e confira seu e-mail antes de solicitar novamente.');
        } else if (failure instanceof ApiError && failure.code === 'EMAIL_DISABLED') {
          setRequestError('O envio de relatórios está temporariamente indisponível. Tente novamente mais tarde.');
        } else {
          cooldown(failure instanceof ApiError ? failure.retryAfterSeconds : undefined);
          setRequestError('Não foi possível confirmar o envio. Confira seu e-mail e o spam antes de solicitar novamente, pois a mensagem pode ter sido enviada.');
        }
      } finally {
        sending.current = false;
      }
    })();
  }

  if (!accountQuery.data) {
    if (accountQuery.isError || accountQuery.fetchStatus === 'paused') {
      return <ErrorState message="Não foi possível verificar o e-mail da sua conta. Confira a conexão e tente novamente." onRetry={() => void refetch()} />;
    }
    return <LoadingState message="Verificando o e-mail da sua conta…" />;
  }

  return (
    <ScreenContainer>
      <Card>
        <ThemedText variant="heading">Relatório por e-mail</ThemedText>
        <TextField label="Enviar para" value={email} editable={false} helperText="O relatório será enviado somente para o e-mail confirmado da sua conta." />
        {accountQuery.isError ? <ThemedText color={colors.warning} accessibilityLiveRegion="polite">Não foi possível atualizar o estado do e-mail. Suas escolhas foram mantidas.</ThemedText> : null}
      </Card>

      {!verified ? (
        <Card>
          <ThemedText variant="heading">Confirme seu e-mail</ThemedText>
          <ThemedText color={colors.textMuted}>Sua conta continua acessível. Solicite o link, confira a caixa de entrada e o spam e confirme no navegador. Depois volte a esta tela; suas escolhas serão mantidas.</ThemedText>
          {verification.message ? <ThemedText selectable color={colors.success} accessibilityLiveRegion="polite">{verification.message}</ThemedText> : null}
          {verification.error ? <ThemedText selectable color={colors.danger} accessibilityLiveRegion="polite">{verification.error}</ThemedText> : null}
          <Button title="Enviar link de confirmação" variant="secondary" loading={verification.resending} disabled={verification.remainingSeconds > 0 || busy} onPress={() => void verification.resendEmail()} />
          {verification.remainingSeconds > 0 ? <ThemedText variant="caption">Aguarde {verification.remainingSeconds}s para solicitar outro link.</ThemedText> : null}
          <Button title="Já confirmei, atualizar" variant="ghost" loading={accountQuery.isFetching} onPress={() => void refetch()} />
        </Card>
      ) : null}

      <Card>
        <ThemedText variant="heading">Período</ThemedText>
        <DateRangeFields startDate={startDate} endDate={endDate} disabled={busy}
          onStartChange={(value) => { edited(); setValue('data_inicio', value, { shouldDirty: true, shouldValidate: true }); }}
          onEndChange={(value) => { edited(); setValue('data_fim', value, { shouldDirty: true, shouldValidate: true }); }}
          startError={errors.data_inicio?.message} endError={errors.data_fim?.message} />
        <ThemedText variant="caption" color={colors.textMuted}>Datas inclusivas, entre 2000 e 2100, com até 366 dias. Alterar este período não muda os filtros das outras telas.</ThemedText>
      </Card>

      <Card>
        <ThemedText variant="heading">Seções</ThemedText>
        <Controller control={control} name="secoes" render={({ field }) => (
          <View style={styles.options}>
            {sections.map((section) => (
              <View key={section.value} style={styles.option}>
                <Host matchContents={{ vertical: true }} seedColor={colors.primary} style={styles.host}>
                  <Checkbox testID={`report-section-${section.value}`} label={section.label} value={field.value.includes(section.value)} disabled={busy}
                    onValueChange={(checked) => { edited(); field.onChange(checked ? [...new Set([...field.value, section.value])] : field.value.filter((value) => value !== section.value)); }} />
                </Host>
                <ThemedText variant="caption" color={colors.textMuted}>{section.description}</ThemedText>
              </View>
            ))}
          </View>
        )} />
        {errors.secoes?.message ? <ThemedText color={colors.danger} accessibilityLiveRegion="polite">{errors.secoes.message}</ThemedText> : null}
      </Card>

      <Card>
        <ThemedText variant="heading">Formatos</ThemedText>
        <Controller control={control} name="formatos" render={({ field }) => (
          <View style={styles.options}>
            {(['pdf', 'csv'] as const).map((format) => (
              <Host key={format} matchContents={{ vertical: true }} seedColor={colors.primary} style={styles.host}>
                <Checkbox testID={`report-format-${format}`} label={format.toUpperCase()} value={field.value.includes(format)} disabled={busy}
                  onValueChange={(checked) => { edited(); field.onChange(checked ? [...new Set([...field.value, format])] : field.value.filter((value) => value !== format)); }} />
              </Host>
            ))}
          </View>
        )} />
        <ThemedText variant="caption" color={colors.textMuted}>PDF reúne as seções marcadas em um documento. CSV inclui um arquivo por seção selecionada.</ThemedText>
        {errors.formatos?.message ? <ThemedText color={colors.danger} accessibilityLiveRegion="polite">{errors.formatos.message}</ThemedText> : null}
      </Card>

      <Card>
        <ThemedText color={colors.textMuted}>Limites: até 1.000 lançamentos confirmados no período, 200 metas quando essa seção estiver marcada e 5 MiB em até seis arquivos. Se exceder os limites, reduza o período ou as seções.</ThemedText>
        {requestError ? <ThemedText selectable color={colors.danger} accessibilityLiveRegion="polite">{requestError}</ThemedText> : null}
        {message ? <ThemedText selectable color={colors.success} accessibilityLiveRegion="polite">{message}</ThemedText> : null}
        {busy ? <ThemedText accessibilityLiveRegion="polite">Preparando e enviando seu relatório…</ThemedText> : null}
        {remainingSeconds > 0 ? <ThemedText testID="report-cooldown" variant="caption">Aguarde {remainingSeconds}s antes de solicitar outro relatório.</ThemedText> : null}
        <Button title="Enviar relatório por e-mail" loading={busy} disabled={!verified || busy || remainingSeconds > 0} onPress={() => void onSubmit()} />
        <Button title="Restaurar escolhas iniciais" variant="ghost" disabled={busy} onPress={() => { reset(defaults); edited(); }} />
      </Card>
    </ScreenContainer>
  );
}

const styles = {
  host: { width: '100%' } satisfies ViewStyle,
  options: { gap: spacing.md } satisfies ViewStyle,
  option: { gap: spacing.xxs } satisfies ViewStyle,
};
