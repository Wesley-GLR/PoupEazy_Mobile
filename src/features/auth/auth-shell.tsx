import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Button, Card, ThemedText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { openPrivacyPolicy } from '@/utils/privacy-policy';

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <BrandLogo orientation="vertical" style={styles.logo} />
          <Card style={styles.card}>
            <View style={styles.heading}>
              <ThemedText variant="title" color={colors.primary} style={styles.center}>{title}</ThemedText>
              <ThemedText color={colors.textMuted} style={styles.center}>{subtitle}</ThemedText>
            </View>
            {children}
            <Button
              title="Política de Privacidade"
              variant="ghost"
              accessibilityRole="link"
              accessibilityHint="Abre a política de privacidade do PoupEazy no navegador."
              onPress={() => void openPrivacyPolicy()}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  fill: { flex: 1 } satisfies ViewStyle,
  safeArea: { flex: 1, backgroundColor: colors.background } satisfies ViewStyle,
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  } satisfies ViewStyle,
  logo: { width: 150, height: 112 },
  card: { width: '100%', maxWidth: 440, padding: spacing.xxl, gap: spacing.xl } satisfies ViewStyle,
  heading: { alignItems: 'center', gap: spacing.sm } satisfies ViewStyle,
  center: { textAlign: 'center' as const },
};
