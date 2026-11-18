import { act, render } from '@testing-library/react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../../features/auth/model/types';
import { useAuthStore } from '../../features/auth/model/authStore';
import { selectAccountKey } from './accountKey';
import { AccountQueryClientProvider } from './AccountQueryClientProvider';

const makeUser = (id: string, currentOrgId = 'org-1'): User => ({
  id,
  email: `${id}@proflu.cn`,
  username: id,
  name: id,
  roles: ['ADMIN'],
  permissions: [],
  emailVerified: true,
  phoneVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
  currentOrgId,
});

const cachedKey = ['orders', 'tag-options'];

function renderProvider() {
  const seen: QueryClient[] = [];
  let mounts = 0;

  function Probe() {
    const client = useQueryClient();
    if (seen.at(-1) !== client) seen.push(client);
    useEffect(() => {
      mounts += 1;
    }, []);
    return null;
  }

  render(
    <AccountQueryClientProvider>
      <Probe />
    </AccountQueryClientProvider>
  );

  return {
    current: () => seen.at(-1)!,
    clients: seen,
    mounts: () => mounts,
  };
}

function signIn(user: User) {
  act(() => {
    useAuthStore.setState({ isAuthenticated: true, user });
  });
}

describe('selectAccountKey', () => {
  it('scopes by user and organization', () => {
    expect(selectAccountKey({ isAuthenticated: true, user: makeUser('a', 'org-1') })).toBe(
      'a:org-1'
    );
    expect(selectAccountKey({ isAuthenticated: true, user: makeUser('a', 'org-2') })).toBe(
      'a:org-2'
    );
  });

  it('treats a persisted user without an authenticated session as anonymous', () => {
    expect(selectAccountKey({ isAuthenticated: false, user: makeUser('a') })).toBe('anonymous');
    expect(selectAccountKey({ isAuthenticated: true, user: null })).toBe('anonymous');
  });
});

describe('AccountQueryClientProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ isAuthenticated: true, user: makeUser('user-a'), loading: false });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('gives a new account a fresh client and drops the previous cache', () => {
    const view = renderProvider();
    const clientA = view.current();
    clientA.setQueryData(cachedKey, ['account-a-data']);

    signIn(makeUser('user-b'));

    const clientB = view.current();
    expect(clientB).not.toBe(clientA);
    expect(clientB.getQueryData(cachedKey)).toBeUndefined();
    expect(clientA.getQueryCache().getAll()).toHaveLength(0);
    expect(view.mounts()).toBe(2);
  });

  it('swaps the client on logout', () => {
    const view = renderProvider();
    const clientA = view.current();
    clientA.setQueryData(cachedKey, ['account-a-data']);

    act(() => {
      useAuthStore.setState({ isAuthenticated: false, user: null });
    });

    expect(view.current()).not.toBe(clientA);
    expect(view.current().getQueryData(cachedKey)).toBeUndefined();
  });

  it('swaps the client when the current organization changes', () => {
    const view = renderProvider();
    const first = view.current();

    act(() => {
      useAuthStore.getState().setUser(makeUser('user-a', 'org-2'));
    });

    expect(view.current()).not.toBe(first);
  });

  it('keeps the client and cache when the same account is updated', () => {
    const view = renderProvider();
    const client = view.current();
    client.setQueryData(cachedKey, ['account-a-data']);

    act(() => {
      useAuthStore.getState().setUser({ ...makeUser('user-a'), name: 'Renamed' });
    });

    expect(view.current()).toBe(client);
    expect(client.getQueryData(cachedKey)).toEqual(['account-a-data']);
    expect(view.mounts()).toBe(1);
  });
});
