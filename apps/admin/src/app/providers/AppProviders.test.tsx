import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AppProviders } from './AppProviders';

const state = vi.hoisted(() => ({
  auth: { isAuthenticated: true, user: { id: 'member-1', currentOrgId: 'org-1' } },
  fetch: vi.fn(),
}));
vi.mock('../../features/auth/model/authStore', () => ({
  useAuthStore: (selector: (auth: typeof state.auth) => unknown) => selector(state.auth),
}));
vi.mock('../routes/router', () => ({ createAppRouter: () => ({}) }));
vi.mock('../routes', () => ({ routes: [] }));
vi.mock('react-router-dom', async () => {
  const { useQuery } = await import('@tanstack/react-query');
  return {
    RouterProvider: function Probe() {
      const result = useQuery({ queryKey: ['same-key'], queryFn: state.fetch });
      return <div>{result.data ?? 'loading'}</div>;
    },
  };
});
afterEach(cleanup);

it('creates a separate cache for another identity, logout and a new organization', async () => {
  state.fetch.mockResolvedValue('first account data');
  const view = render(<AppProviders />);
  await screen.findByText('first account data');
  state.auth = { isAuthenticated: false, user: { id: 'member-1', currentOrgId: 'org-1' } };
  state.fetch.mockResolvedValue('anonymous');
  view.rerender(<AppProviders />);
  expect(screen.queryByText('first account data')).not.toBeInTheDocument();
  await screen.findByText('anonymous');
  state.auth = { isAuthenticated: true, user: { id: 'member-2', currentOrgId: 'org-1' } };
  state.fetch.mockResolvedValue('second account data');
  view.rerender(<AppProviders />);
  expect(screen.queryByText('first account data')).not.toBeInTheDocument();
  await screen.findByText('second account data');
  state.auth = { isAuthenticated: true, user: { id: 'member-2', currentOrgId: 'org-2' } };
  state.fetch.mockResolvedValue('another organization');
  view.rerender(<AppProviders />);
  expect(screen.queryByText('second account data')).not.toBeInTheDocument();
  await screen.findByText('another organization');
  expect(state.fetch).toHaveBeenCalledTimes(4);
});
