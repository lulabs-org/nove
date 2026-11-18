import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a React Query client with the app-wide defaults.
 *
 * Do not share one instance across accounts: query keys are not scoped by user,
 * so each signed-in account gets its own client (see AccountQueryClientProvider).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
      },
    },
  });
}
