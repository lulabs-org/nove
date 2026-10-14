import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectApi } from './projectApi';

const apiMocks = vi.hoisted(() => ({ mutator: vi.fn() }));
vi.mock('../../../shared/lib/api/mutator', () => ({ mutator: apiMocks.mutator }));

describe('projectApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps the paginated project response and removes empty filters', async () => {
    apiMocks.mutator.mockResolvedValue({
      items: [{ id: 'project-1' }],
      page: 2,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });

    await expect(
      projectApi.list({ page: 2, pageSize: 20, category: '', status: 'PUBLISHED' })
    ).resolves.toMatchObject({ data: [{ id: 'project-1' }], page: 2, total: 1 });
    expect(apiMocks.mutator).toHaveBeenCalledWith({
      url: '/admin/projects',
      method: 'GET',
      params: { page: 2, pageSize: 20, status: 'PUBLISHED' },
    });
  });

  it('uses the dedicated status and soft-delete endpoints', async () => {
    apiMocks.mutator.mockResolvedValue({ id: 'project-1' });

    await projectApi.updateStatus('project-1', 'COMPLETED');
    await projectApi.delete('project-1');

    expect(apiMocks.mutator).toHaveBeenNthCalledWith(1, {
      url: '/admin/projects/project-1/status',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: { status: 'COMPLETED' },
    });
    expect(apiMocks.mutator).toHaveBeenNthCalledWith(2, {
      url: '/admin/projects/project-1',
      method: 'DELETE',
    });
  });

  it('searches global active users through the project owner endpoint', async () => {
    apiMocks.mutator.mockResolvedValue({
      items: [{ id: 'user-1', displayName: 'External Owner' }],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });

    await projectApi.ownerOptions({ keyword: 'External' });

    expect(apiMocks.mutator).toHaveBeenCalledWith({
      url: '/admin/projects/owner-options',
      method: 'GET',
      params: { keyword: 'External' },
    });
  });
});
