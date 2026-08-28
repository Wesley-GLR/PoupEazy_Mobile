import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme';

import { Button } from './button';
import { ThemedText } from './themed-text';

export function LoadingState({ message = 'Carregando…' }: { message?: string }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.state}>
      <ActivityIndicator color={colors.primary} size="large" />
      <ThemedText color={colors.textMuted}>{message}</ThemedText>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.state}>
      <ThemedText variant="heading">{title}</ThemedText>
      <ThemedText color={colors.textMuted} style={styles.centered}>
        {message}
      </ThemedText>
    </View>
  );
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.state}>
      <ThemedText variant="heading" color={colors.danger}>
        Algo deu errado
      </ThemedText>
      <ThemedText selectable color={colors.textMuted} style={styles.centered}>
        {message}
      </ThemedText>
      {onRetry ? <Button title="Tentar novamente" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = {
  state: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  } satisfies ViewStyle,
  centered: { textAlign: 'center' as const },
};
