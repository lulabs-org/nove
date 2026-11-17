import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '../../shared/lib/queryClient';
import { createAppRouter } from '../routes/router';
import { routes } from '../routes';

const router = createAppRouter(routes);

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
