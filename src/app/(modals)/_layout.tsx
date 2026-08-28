import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.primary, presentation: 'modal' }}>
      <Stack.Screen name="transaction-form" options={{ title: 'Transação' }} />
      <Stack.Screen name="budget-form" options={{ title: 'Orçamento mensal' }} />
      <Stack.Screen name="goal-form" options={{ title: 'Meta' }} />
      <Stack.Screen name="goal-movement" options={{ title: 'Movimentar meta' }} />
      <Stack.Screen name="category-form" options={{ title: 'Categoria' }} />
    </Stack>
  );
}
