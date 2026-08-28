import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.primary }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ title: 'Categorias' }} />
      <Stack.Screen name="open-finance" options={{ title: 'Open Finance' }} />
      <Stack.Screen name="profile" options={{ title: 'Meu perfil' }} />
    </Stack>
  );
}
