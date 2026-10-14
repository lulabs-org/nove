import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { RoleManagement } from './RoleManagement';

const apiMocks = vi.hoisted(() => ({
  unbindMember: vi.fn(),
  listRoles: vi.fn(),
  roleOptions: vi.fn(),
  permissionTree: vi.fn(),
}));

vi.mock('../../../app/guards/Perm', () => ({
  Perm: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { currentOrgId: 'org-1' } }),
}));

vi.mock('./api/roleManagementApi', () => ({
  roleManagementApi: {
    unbindMember: apiMocks.unbindMember,
    list: apiMocks.listRoles,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bindMember: vi.fn(),
    getRoleDataRules: vi.fn().mockResolvedValue([]),
    setRoleDataRules: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('./api/orgMemberApi', () => ({
  orgMemberApi: { roleOptions: apiMocks.roleOptions },
}));

vi.mock('../../governance/permissions/api/permissionManagementApi', () => ({
  permissionManagementApi: {
    permissionTree: apiMocks.permissionTree,
    listDataRules: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  },
}));

describe('RoleManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    apiMocks.listRoles.mockResolvedValue({
      data: [
        {
          id: 'role-1',
          name: '管理员',
          code: 'ADMIN',
          type: 'SYSTEM',
          level: 1,
          active: true,
          permissionIds: [],
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    apiMocks.roleOptions.mockResolvedValue({
      data: [
        {
          id: 'member-1',
          userId: 'user-1',
          displayName: '杨仕明',
          email: 'yangshiming@example.com',
          avatar: null,
          departmentNames: ['班主任'],
          roleIds: ['role-1'],
          roleBindings: [
            { id: 'binding-1', roleId: 'role-1' },
            { id: 'other-binding', roleId: 'other-role' },
          ],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    apiMocks.permissionTree.mockResolvedValue([]);
  });

  it.each(['single', 'batch'])(
    'removes only the selected role binding after confirmation (%s)',
    async (mode) => {
      apiMocks.unbindMember.mockResolvedValue(undefined);
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <RoleManagement />
        </QueryClientProvider>
      );
      await screen.findByText('杨仕明');
      if (mode === 'single') fireEvent.click(screen.getByRole('button', { name: '移除' }));
      else {
        expect(screen.getByRole('button', { name: '移除成员' })).toBeDisabled();
        fireEvent.click(screen.getAllByRole('checkbox')[1]);
        fireEvent.click(screen.getByRole('button', { name: /移除成员/ }));
      }
      expect(apiMocks.unbindMember).not.toHaveBeenCalled();
      expect(await screen.findByText('成员仍保留在组织中，其他角色不受影响。')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '确认移除' }));
      await waitFor(() => expect(apiMocks.unbindMember).toHaveBeenCalledWith('org-1', 'binding-1'));
      expect(apiMocks.unbindMember).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(apiMocks.roleOptions.mock.calls.length).toBeGreaterThan(1));
    }
  );

  it('refreshes members and reports failures when unbinding fails', async () => {
    apiMocks.unbindMember.mockRejectedValue(new Error('Forbidden'));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <RoleManagement />
      </QueryClientProvider>
    );
    await screen.findByText('杨仕明');
    fireEvent.click(screen.getByRole('button', { name: '移除' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认移除' }));
    expect(await screen.findByText('有 1 条角色绑定移除失败，请刷新后重试')).toBeInTheDocument();
    await waitFor(() => expect(apiMocks.roleOptions.mock.calls.length).toBeGreaterThan(1));
  });

  it('disables removal and selection for super administrators', async () => {
    const roles = await apiMocks.listRoles();
    roles.data[0].code = 'SUPER_ADMIN';
    roles.data[0].name = '超级管理员';
    apiMocks.listRoles.mockResolvedValue(roles);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <RoleManagement />
      </QueryClientProvider>
    );
    await screen.findByText('杨仕明');
    expect(screen.getByRole('button', { name: '移除' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '移除成员' })).toBeDisabled();
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeDisabled();
    expect(apiMocks.unbindMember).not.toHaveBeenCalled();
  });

  it('applies ellipsis only to the member name and not the avatar text', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RoleManagement />
      </QueryClientProvider>
    );

    expect(await screen.findByText('杨仕明')).toHaveClass('org-role-member-name-text');
    expect(screen.getByText('仕明')).not.toHaveClass('org-role-member-name-text');
  });

  it('groups permissions by resource and can show only selected permissions', async () => {
    apiMocks.listRoles.mockResolvedValue({
      data: [
        {
          id: 'role-2',
          name: '师傅',
          code: 'MENTOR',
          type: 'CUSTOM',
          level: 10,
          active: true,
          permissionIds: ['permission-user-read'],
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    apiMocks.permissionTree.mockResolvedValue([
      {
        id: 'permission-user-read',
        name: '查看用户',
        code: 'user:read',
        resource: 'user',
        action: 'read',
        type: 'MENU',
        active: true,
        children: [],
      },
      {
        id: 'permission-user-create',
        name: '创建用户',
        code: 'user:create',
        resource: 'user',
        action: 'create',
        type: 'BUTTON',
        active: true,
        children: [],
      },
      {
        id: 'permission-meeting-read',
        name: '查看会议',
        code: 'meeting:read',
        resource: 'meeting',
        action: 'read',
        type: 'MENU',
        active: true,
        children: [],
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RoleManagement />
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: /配置权限/ }));
    expect(await screen.findByRole('complementary', { name: '权限分类' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /用户管理/ }));
    expect(screen.getByText('查看用户')).toBeInTheDocument();
    expect(screen.getByText('创建用户')).toBeInTheDocument();
    expect(screen.queryByText('查看会议')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '仅看已选' }));
    expect(screen.getByText('查看用户')).toBeInTheDocument();
    expect(screen.queryByText('创建用户')).not.toBeInTheDocument();
  });
});
