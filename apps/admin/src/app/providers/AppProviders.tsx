import { useState } from 'react';
import { useAuthStore } from '../../features/auth/model/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from '../routes/router';
import { routes } from '../routes';

const router = createAppRouter(routes);

export function AppProviders() {
  const user = useAuthStore((state) => state.user);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const identity = authenticated ? `${user?.currentOrgId}:${user?.id}` : 'anonymous';
  return <IdentityProviders key={identity} />;
}

function IdentityProviders() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
