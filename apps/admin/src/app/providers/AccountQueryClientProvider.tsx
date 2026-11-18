import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuthStore } from '../../features/auth/model/authStore';
import { createQueryClient } from '../../shared/lib/queryClient';
import { selectAccountKey } from './accountKey';

interface AccountScope {
  accountKey: string;
  client: QueryClient;
}

/**
 * Gives each account its own QueryClient so cached data can never leak to the
 * next account, however the account changed (login, logout, 401, another tab).
 *
 * The subtree is remounted on change because React Query observers keep the
 * client they were created with.
 */
export function AccountQueryClientProvider({ children }: { children: ReactNode }) {
  const accountKey = useAuthStore(selectAccountKey);
  const [scope, setScope] = useState<AccountScope>(() => ({
    accountKey,
    client: createQueryClient(),
  }));

  let current = scope;
  if (scope.accountKey !== accountKey) {
    current = { accountKey, client: createQueryClient() };
    setScope(current);
  }

  const previousClient = useRef<QueryClient | null>(null);
  useEffect(() => {
    const previous = previousClient.current;
    previousClient.current = current.client;
    if (previous && previous !== current.client) {
      previous.clear();
    }
  }, [current.client]);

  return (
    <QueryClientProvider client={current.client}>
      <Fragment key={current.accountKey}>{children}</Fragment>
    </QueryClientProvider>
  );
}
