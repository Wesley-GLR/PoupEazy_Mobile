import type { PropsWithChildren } from 'react';

import { AuthProvider } from '@/auth/auth-context';
import { PeriodProvider } from '@/state/period-context';

import { AppQueryProvider } from './query-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <PeriodProvider>{children}</PeriodProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}
