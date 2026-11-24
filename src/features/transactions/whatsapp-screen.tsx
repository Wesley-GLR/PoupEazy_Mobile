import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { whatsappService } from '@/api/services';
import { Button, Card, LoadingState, ScreenContainer, ThemedText } from '@/components/ui';
import { colors } from '@/theme';
import type { WhatsAppLinkStatus } from '@/types/api';
import { getErrorMessage } from '@/utils/format';

export default function WhatsAppScreen() {
  const [status, setStatus] = useState<WhatsAppLinkStatus | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chatUrl = status?.url;

  useEffect(() => {
    let active = true;
    whatsappService.status()
      .then((result) => { if (active) setStatus(result); })
      .catch(() => { if (active) setError('O WhatsApp está indisponível neste ambiente.'); });
    return () => { active = false; };
  }, []);

  async function perform(task: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function refreshLink() {
    const result = await whatsappService.status();
    setStatus(result);
    if (result.vinculado) setLink(null);
  }

  function confirmUnlink() {
    Alert.alert('Desvincular WhatsApp?', 'Para usar o bot novamente, vincule seu número outra vez.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desvincular',
        style: 'destructive',
        onPress: () => void perform(async () => {
          await whatsappService.unlink();
          setLink(null);
          await refreshLink();
        }),
      },
    ]);
  }

  if (!status && !error) return <LoadingState message="Consultando vínculo com o WhatsApp…" />;

  return (
    <ScreenContainer>
      <Card>
        {error ? <ThemedText color={colors.danger}>{error}</ThemedText> : null}
        {!status ? (
          <Button title="Tentar novamente" loading={busy} onPress={() => void perform(refreshLink)} />
        ) : !status.habilitado ? (
          <ThemedText>O WhatsApp está desativado neste ambiente.</ThemedText>
        ) : status.vinculado && chatUrl ? (
          <>
            <ThemedText variant="heading">WhatsApp vinculado</ThemedText>
            <ThemedText>Envie “cabelo 35” ou “relatório semanal” direto no WhatsApp. Seu vínculo fica salvo nesta conta.</ThemedText>
            <Button title="Abrir WhatsApp" disabled={busy} onPress={() => void perform(() => Linking.openURL(chatUrl))} />
            <Button title="Desvincular" variant="secondary" disabled={busy} onPress={confirmUnlink} />
          </>
        ) : (
          <>
            <ThemedText variant="heading">Vincule seu celular</ThemedText>
            <ThemedText>Envie a mensagem preparada pelo WhatsApp uma vez. O código vence em 10 minutos.</ThemedText>
            {link ? (
              <>
                <Button title="Abrir WhatsApp para vincular" disabled={busy} onPress={() => void perform(() => Linking.openURL(link))} />
                <Button title="Já enviei a mensagem" variant="secondary" loading={busy} onPress={() => void perform(refreshLink)} />
                <Button title="Gerar novo link" variant="ghost" disabled={busy} onPress={() => void perform(async () => setLink((await whatsappService.createLink()).url))} />
              </>
            ) : (
              <Button title="Gerar link de vínculo" loading={busy} onPress={() => void perform(async () => setLink((await whatsappService.createLink()).url))} />
            )}
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}
