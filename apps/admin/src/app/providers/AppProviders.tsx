import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from '../routes/router';
import { routes } from '../routes';
import { AccountQueryClientProvider } from './AccountQueryClientProvider';

const router = createAppRouter(routes);

export function AppProviders() {
  return (
    <AccountQueryClientProvider>
      <RouterProvider router={router} />
    </AccountQueryClientProvider>
  );
}
