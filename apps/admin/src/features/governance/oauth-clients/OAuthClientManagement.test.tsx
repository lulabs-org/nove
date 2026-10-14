import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { OAuthClientManagement } from './OAuthClientManagement';
import { oauthClientApi } from './api/oauthClientApi';

vi.mock('../../../app/guards/Perm', () => ({
  Perm: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./api/oauthClientApi', () => ({
  oauthClientApi: {
    list: vi.fn(),
    scopes: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    rotateSecret: vi.fn(),
  },
}));

describe('OAuthClientManagement', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.mocked(oauthClientApi.scopes).mockResolvedValue([]);
    vi.mocked(oauthClientApi.list).mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 2,
      items: [
        {
          id: 'system-client',
          clientId: 'nove-cli',
          clientType: 'PUBLIC',
          status: 'ACTIVE',
          isSystem: true,
          name: 'Nove CLI',
          redirectUris: ['http://127.0.0.1/oauth/callback'],
          grants: ['authorization_code', 'refresh_token'],
          scopes: ['meeting:read'],
          credentialVersion: 1,
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:00.000Z',
        },
        {
          id: 'managed-client',
          clientId: 'managed-id',
          clientType: 'CONFIDENTIAL',
          status: 'ACTIVE',
          isSystem: false,
          name: 'Managed App',
          redirectUris: ['https://example.com/callback'],
          grants: ['authorization_code', 'refresh_token'],
          scopes: ['meeting:read'],
          credentialVersion: 1,
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:00.000Z',
        },
      ],
    });
  });

  it('renders system clients as read-only and exposes actions for managed clients', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OAuthClientManagement />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Nove CLI')).toBeInTheDocument();
    expect(screen.getByText('系统内置')).toBeInTheDocument();
    expect(screen.getByText('只读')).toBeInTheDocument();
    expect(screen.getByText('轮换密钥')).toBeInTheDocument();
    expect(screen.getByText('禁用')).toBeInTheDocument();
  });
});
