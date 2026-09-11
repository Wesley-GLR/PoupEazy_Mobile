import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/auth-context';
import { PeriodProvider } from '@/state/period-context';

import { AppQueryProvider } from './query-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AppQueryProvider>
        <AuthProvider>
          <PeriodProvider>{children}</PeriodProvider>
        </AuthProvider>
      </AppQueryProvider>
    </SafeAreaProvider>
  );
}
