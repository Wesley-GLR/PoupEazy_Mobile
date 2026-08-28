import { PluggyConnect } from 'react-native-pluggy-connect';
import { useState } from 'react';
import { Alert, RefreshControl, View, type ViewStyle } from 'react-native';

import {
  useConnectIntegration,
  useDisconnectIntegration,
  useIntegrations,
  usePluggyConnectToken,
  useSyncIntegration,
} from '@/api/hooks';
import { Button, Card, EmptyState, ErrorState, LoadingState, ScreenContainer, ThemedText, Badge } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { Integration } from '@/types/api';
import { formatDate, getErrorMessage } from '@/utils/format';

export default function IntegrationsScreen() {
  const query = useIntegrations();
  const connectToken = usePluggyConnectToken();
  const connect = useConnectIntegration();
  const sync = useSyncIntegration();
  const disconnect = useDisconnectIntegration();
  const [token, setToken] = useState<string | null>(null);

  async function openConnect() {
    try {
      const response = await connectToken.mutateAsync();
      setToken(response.connectToken);
    } catch (error) {
      Alert.alert('Open Finance indisponível', getErrorMessage(error));
    }
  }

  async function syncBank(integration: Integration) {
    try {
      const result = await sync.mutateAsync(integration.id);
      Alert.alert(
        'Sincronização concluída',
        `${result.inserted} nova(s), ${result.updated} atualizada(s) e ${result.unchanged} já estavam em dia.`,
      );
    } catch (error) {
      Alert.alert('Não foi possível sincronizar', getErrorMessage(error));
    }
  }

  function confirmDisconnect(integration: Integration) {
    Alert.alert('Desconectar instituição?', `A conexão com ${integration.instituicao} será desativada. As transações importadas continuarão no histórico.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desconectar', style: 'destructive', onPress: () => disconnect.mutate(integration.id, { onError: (error) => Alert.alert('Não foi possível desconectar', getErrorMessage(error)) }) },
    ]);
  }

  if (query.isLoading) return <LoadingState message="Carregando conexões…" />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  return (
    <>
      <ScreenContainer refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}>
        <Card style={styles.infoCard}>
          <ThemedText variant="heading" color={colors.primary}>Contas em um só lugar</ThemedText>
          <ThemedText color={colors.textMuted}>
            Conecte uma instituição com a Pluggy. A importação é feita pelo backend, que associa cada transação ao mês correto e nunca envia o identificador privado da conexão ao app.
          </ThemedText>
          <Button title="Conectar instituição" loading={connectToken.isPending} onPress={() => void openConnect()} />
        </Card>

        {(query.data ?? []).length ? (query.data ?? []).map((integration) => (
          <Card key={integration.id}>
            <View style={styles.header}>
              <View style={styles.flex}>
                <ThemedText variant="heading">{integration.instituicao}</ThemedText>
                <ThemedText variant="caption" color={colors.textMuted}>
                  {integration.ultimo_uso ? `Última sincronização: ${formatDate(integration.ultimo_uso)}` : `Conectada em ${formatDate(integration.criado_em)}`}
                </ThemedText>
              </View>
              <Badge label="Ativa" tone="success" />
            </View>
            <Button title="Sincronizar agora" variant="secondary" loading={sync.isPending && sync.variables === integration.id} onPress={() => void syncBank(integration)} />
            <Button title="Desconectar" variant="ghost" onPress={() => confirmDisconnect(integration)} />
          </Card>
        )) : <EmptyState title="Nenhuma conta conectada" message="Conecte sua primeira instituição para trazer as movimentações ao PoupEazy." />}

        <Card style={styles.warningCard}>
          <ThemedText variant="label" color={colors.warning}>Teste local primeiro</ThemedText>
          <ThemedText variant="caption" color={colors.textMuted}>
            O modal básico funciona no Expo Go compatível com SDK 57. O retorno de OAuth e de aplicativos bancários será validado depois em um development build Android local.
          </ThemedText>
        </Card>
      </ScreenContainer>

      {token ? (
        <PluggyConnect
          connectToken={token}
          includeSandbox={__DEV__}
          language="pt"
          theme="light"
          forceOauthInBrowser
          allowConnectInBackground
          onClose={() => setToken(null)}
          onError={(error) => {
            setToken(null);
            Alert.alert('Falha na conexão', error.message || 'A instituição não concluiu a conexão.');
          }}
          onSuccess={async ({ item }) => {
            try {
              const connectedItem = item as unknown as { id: string; connector?: { name?: string } };
              const institution = connectedItem.connector?.name?.trim() || 'Instituição conectada';
              const integration = await connect.mutateAsync({ instituicao: institution, itemId: connectedItem.id });
              setToken(null);
              await syncBank(integration);
            } catch (error) {
              setToken(null);
              Alert.alert('Conexão criada, mas não salva', getErrorMessage(error));
            }
          }}
        />
      ) : null}
    </>
  );
}

const styles = {
  infoCard: { backgroundColor: colors.primarySoft, borderColor: colors.primary } satisfies ViewStyle,
  warningCard: { backgroundColor: colors.warningSoft, borderColor: colors.warning } satisfies ViewStyle,
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md } satisfies ViewStyle,
  flex: { flex: 1, gap: spacing.xs } satisfies ViewStyle,
};
