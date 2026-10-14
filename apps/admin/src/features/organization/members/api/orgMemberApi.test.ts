import { beforeEach, describe, expect, it, vi } from 'vitest';
import { orgMemberApi } from './orgMemberApi';

const apiMocks = vi.hoisted(() => ({
  listMembers: vi.fn(),
  mutator: vi.fn(),
}));

vi.mock('../../../../shared/lib/api/orval/business/admin-org-members', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('../../../../shared/lib/api/orval/business/admin-org-members')
    >();
  return {
    ...original,
    orgMemberControllerListMembers: apiMocks.listMembers,
  };
});

vi.mock('../../../../shared/lib/api/mutator', () => ({ mutator: apiMocks.mutator }));

describe('orgMemberApi list contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps the lightweight member list response', async () => {
    apiMocks.listMembers.mockResolvedValue({
      items: [{ id: 'member-1', userId: 'user-1' }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    await expect(orgMemberApi.list('org-1', { page: 1, pageSize: 20 })).resolves.toEqual({
      data: [{ id: 'member-1', userId: 'user-1' }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it('requests detail-free role options with server-side assignment filtering', async () => {
    apiMocks.mutator.mockResolvedValue({
      items: [{ id: 'member-1', userId: 'user-1', departmentNames: [], roleIds: ['role-1'] }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    await orgMemberApi.roleOptions('org-1', {
      page: 1,
      pageSize: 20,
      roleId: 'role-1',
      assignment: 'assigned',
    });

    expect(apiMocks.mutator).toHaveBeenCalledWith({
      url: '/admin/orgs/org-1/member-role-options',
      method: 'GET',
      params: {
        page: 1,
        pageSize: 20,
        roleId: 'role-1',
        assignment: 'assigned',
      },
    });
  });
});
