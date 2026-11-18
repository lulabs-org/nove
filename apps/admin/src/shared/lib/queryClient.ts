import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide React Query client.
 *
 * Query keys are not scoped by user, so anything that changes the signed-in
 * account must call `queryClient.clear()` to drop the previous account's data.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});
