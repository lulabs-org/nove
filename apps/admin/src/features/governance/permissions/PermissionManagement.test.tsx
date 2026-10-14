import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { PermissionManagement } from './PermissionManagement';
import { permissionManagementApi } from './api/permissionManagementApi';

vi.mock('../../../app/guards/Perm', () => ({
  Perm: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./api/permissionManagementApi', () => ({
  permissionManagementApi: {
    permissionTree: vi.fn(),
    listPermissions: vi.fn(),
    createPermission: vi.fn(),
    updatePermission: vi.fn(),
    deletePermission: vi.fn(),
    listDataRules: vi.fn(),
    createDataRule: vi.fn(),
    updateDataRule: vi.fn(),
    deleteDataRule: vi.fn(),
  },
}));

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe('PermissionManagement', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

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

    vi.mocked(permissionManagementApi.permissionTree).mockResolvedValue([
      {
        id: 'perm-1',
        name: '订单管理',
        code: 'order:manage',
        resource: 'order',
        action: 'manage',
        type: 'MENU',
        level: 1,
        sortOrder: 1,
        active: true,
        oauthDelegatable: false,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        children: [
          {
            id: 'perm-2',
            name: '订单查看',
            code: 'order:read',
            resource: 'order',
            action: 'read',
            type: 'API',
            parentId: { id: 'perm-1' },
            level: 2,
            sortOrder: 1,
            active: true,
            oauthDelegatable: true,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          },
        ],
      },
    ]);

    vi.mocked(permissionManagementApi.listPermissions).mockResolvedValue({
      data: [
        {
          id: 'perm-1',
          name: '订单管理',
          code: 'order:manage',
          resource: 'order',
          action: 'manage',
          type: 'MENU',
          level: 1,
          sortOrder: 1,
          active: true,
          oauthDelegatable: false,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });

    vi.mocked(permissionManagementApi.listDataRules).mockResolvedValue({
      data: [
        {
          id: 'rule-1',
          name: '仅查看本人负责订单',
          code: 'order_owner_only',
          resource: 'order',
          action: 'read',
          condition: '{"assigneeId": "${userId}"}',
          active: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <PermissionManagement />
      </QueryClientProvider>
    );

  it('renders permission tabs and tab bar summary correctly', async () => {
    renderComponent();

    // Verify tabs exist
    expect(screen.getByRole('tab', { name: /权限项/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /数据规则/ })).toBeInTheDocument();

    // Verify summary
    await waitFor(() => {
      expect(screen.getByText(/权限项 1/)).toBeInTheDocument();
      expect(screen.getByText(/数据规则 1/)).toBeInTheDocument();
    });

    // Verify permission table row
    expect(await screen.findByText('order:manage')).toBeInTheDocument();
  });

  it('can switch to data rules tab and view data rule content', async () => {
    const user = userEvent.setup();
    renderComponent();

    const dataRulesTab = screen.getByRole('tab', { name: /数据规则/ });
    await user.click(dataRulesTab);

    // Verify data rule item appears
    expect(await screen.findByText('仅查看本人负责订单')).toBeInTheDocument();
    expect(screen.getByText('order_owner_only')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '权限条件 (JSON)' })).toBeInTheDocument();
    const conditionCell = screen.getByText('{"assigneeId": "${userId}"}').closest('td');
    expect(conditionCell).toHaveTextContent('{"assigneeId": "${userId}"}');
    expect(conditionCell?.textContent).toBe('{"assigneeId": "${userId}"}');
  });
});
