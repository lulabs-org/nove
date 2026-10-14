import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrivePermissionModal } from './DrivePermissionModal';
import type { DriveNode, DriveSpace } from '../model/types';

const mocks = vi.hoisted(() => ({
  listGrants: vi.fn(),
  putGrant: vi.fn(),
  deleteGrant: vi.fn(),
  listMembers: vi.fn(),
  roles: vi.fn(),
  departments: vi.fn(),
}));

vi.mock('../api/driveApi', () => ({
  driveApi: {
    listGrants: mocks.listGrants,
    putGrant: mocks.putGrant,
    deleteGrant: mocks.deleteGrant,
  },
}));

vi.mock('../../organization/members/api/orgMemberApi', () => ({
  orgMemberApi: {
    list: mocks.listMembers,
    roles: mocks.roles,
    departments: mocks.departments,
  },
}));

vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      currentOrgId: 'org-1',
    },
  }),
}));

describe('DrivePermissionModal', () => {
  const mockNode: DriveNode = {
    id: 'node-1',
    spaceId: 'space-1',
    parentId: null,
    type: 'FILE',
    name: 'nove-english.m4a',
    inheritAcl: true,
    fileId: 'file-1',
    contentType: 'audio/mp4',
    sizeBytes: '1048576',
    fileStatus: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const mockSpace: DriveSpace = {
    id: 'space-1',
    name: '公共空间',
    type: 'ORG',
    orgId: 'org-1',
  };

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

    mocks.listGrants.mockResolvedValue([
      {
        id: 'grant-1',
        principalType: 'USER',
        principalId: 'user-2',
        effect: 'ALLOW',
        actions: ['VIEW', 'DOWNLOAD'],
      },
    ]);
    mocks.listMembers.mockResolvedValue({
      data: [
        {
          id: 'member-2',
          userId: 'user-2',
          user: {
            username: 'alice',
            email: 'alice@example.com',
            profile: { displayName: 'Alice' },
          },
        },
      ],
      total: 1,
    });
    mocks.roles.mockResolvedValue([{ id: 'role-admin', name: '系统管理员', code: 'ADMIN' }]);
    mocks.departments.mockResolvedValue([{ id: 'dept-tech', name: '技术研发部' }]);
  });

  it('renders node title, existing grants and permission details', async () => {
    render(
      <DrivePermissionModal node={mockNode} space={mockSpace} open={true} onClose={vi.fn()} />
    );

    expect(await screen.findByText('nove-english.m4a')).toBeInTheDocument();
    expect(screen.getByText('所属空间：公共空间 · 已开启父级权限继承')).toBeInTheDocument();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('允许')).toBeInTheDocument();
    expect(screen.getAllByText('预览').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('下载').length).toBeGreaterThanOrEqual(1);
  });

  it('displays permission rule explanation when clicking the help icon', async () => {
    const user = userEvent.setup();
    render(
      <DrivePermissionModal node={mockNode} space={mockSpace} open={true} onClose={vi.fn()} />
    );

    await screen.findByText('nove-english.m4a');
    const helpBtn = screen.getByRole('button', { name: '查看权限判定规则说明' });
    expect(helpBtn).toBeInTheDocument();

    await user.click(helpBtn);
    expect(await screen.findByText('权限判定规则说明')).toBeInTheDocument();
    expect(screen.getByText(/组织成员默认具备基础只读与查看权限/)).toBeInTheDocument();
    expect(screen.getByText(/阻断对应操作/)).toBeInTheDocument();
  });

  it('handles preset selection and updates selected actions', async () => {
    const user = userEvent.setup();
    render(
      <DrivePermissionModal node={mockNode} space={mockSpace} open={true} onClose={vi.fn()} />
    );

    await screen.findByText('nove-english.m4a');
    expect(screen.getByText('已选 2 项')).toBeInTheDocument();

    const fullControlBtn = screen.getByRole('button', { name: /完全控制/ });
    await user.click(fullControlBtn);
    expect(screen.getByText('已选 8 项')).toBeInTheDocument();

    const editableBtn = screen.getByRole('button', { name: /读写协作/ });
    await user.click(editableBtn);
    expect(screen.getByText('已选 5 项')).toBeInTheDocument();
  });

  it('supports selecting all organization members (ORG) and adding grant', async () => {
    mocks.putGrant.mockResolvedValue({ id: 'grant-2' });
    const user = userEvent.setup();
    render(
      <DrivePermissionModal node={mockNode} space={mockSpace} open={true} onClose={vi.fn()} />
    );

    await screen.findByText('nove-english.m4a');

    // Switch to 全体成员
    await user.click(screen.getByText('全体成员'));
    expect(await screen.findByText('当前机构全体成员')).toBeInTheDocument();

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /添加授权规则/ });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mocks.putGrant).toHaveBeenCalledWith('node-1', {
        principalType: 'ORG',
        principalId: 'org-1',
        effect: 'ALLOW',
        actions: ['VIEW', 'DOWNLOAD'],
      });
    });
  });
});
