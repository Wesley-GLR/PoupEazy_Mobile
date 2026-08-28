import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/auth-context';

export default function IndexRoute() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? '/(tabs)/(home)' : '/(auth)/login'} />;
}
