import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View, type ViewStyle } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AppHeader } from '@/components/app-header';
import { BrandLogo } from '@/components/brand-logo';
import { MenuRow } from '@/components/menu-row';
import { Card, ScreenContainer, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function MoreScreen() {
  const { profile, user } = useAuth();
  return (
    <ScreenContainer withTopInset>
      <AppHeader title="Mais" subtitle="Configurações e recursos do PoupEazy." />
      <Card style={styles.profileCard}>
        <BrandLogo style={styles.logo} />
        <View style={styles.flex}>
          <ThemedText variant="heading">{profile?.nome ?? 'Sua conta'}</ThemedText>
          <ThemedText variant="caption" color={colors.textMuted}>{user?.email}</ThemedText>
        </View>
      </Card>
      <Card style={styles.menu}>
        <MenuRow icon="account-outline" title="Meu perfil" subtitle="Nome, telefone e senha" onPress={() => router.push('/(tabs)/(more)/profile')} />
        <MenuRow icon="shape-outline" title="Categorias" subtitle="Organize receitas e despesas" onPress={() => router.push('/(tabs)/(more)/categories')} />
        <MenuRow icon="bank-outline" title="Open Finance" subtitle="Conecte e sincronize suas contas" onPress={() => router.push('/(tabs)/(more)/open-finance')} />
      </Card>
      <ThemedText variant="caption" color={colors.textMuted} style={styles.center}>
        PoupEazy {Constants.expoConfig?.version ? `v${Constants.expoConfig.version}` : ''} · Projeto acadêmico
      </ThemedText>
    </ScreenContainer>
  );
}

const styles = {
  profileCard: { flexDirection: 'row', alignItems: 'center' } satisfies ViewStyle,
  logo: { width: 88, height: 42 },
  flex: { flex: 1, gap: spacing.xs } satisfies ViewStyle,
  menu: { padding: 0, gap: 0, overflow: 'hidden' } satisfies ViewStyle,
  center: { textAlign: 'center' as const },
};
