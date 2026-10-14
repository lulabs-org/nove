import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillManagement } from './SkillManagement';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ checkPermission: () => true }),
}));

vi.mock('./skillApi', () => ({
  skillApi: {
    list: mocks.list,
    get: mocks.get,
    upload: mocks.upload,
    update: vi.fn(),
    activate: vi.fn(),
    deleteVersion: vi.fn(),
    delete: vi.fn(),
    download: vi.fn(),
  },
}));

describe('SkillManagement', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const skill = {
      id: 'skill-1',
      code: 'demo-skill',
      name: '演示技能',
      description: '用于测试',
      category: 'GENERAL',
      status: 'ACTIVE',
      currentVersion: '1.0.0',
      createdAt: '2026-09-28T00:00:00Z',
      updatedAt: '2026-09-28T00:00:00Z',
    };
    mocks.list.mockResolvedValue({ items: [skill], total: 1, page: 1, pageSize: 20 });
    mocks.get.mockResolvedValue({
      ...skill,
      versions: [
        {
          id: 'version-1',
          version: '1.0.0',
          changelog: '首次发布',
          sizeBytes: '1024',
          checksumSha256: null,
          createdAt: '2026-09-28T00:00:00Z',
        },
      ],
    });
  });

  it('shows a skill, its current version, and the Zip upload action', async () => {
    const user = userEvent.setup();
    render(<SkillManagement />);
    await waitFor(() => expect(screen.getByText('演示技能')).toBeInTheDocument());
    expect(screen.getByText('demo-skill')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查看版本' }));
    await waitFor(() => expect(screen.getByText('首次发布')).toBeInTheDocument());
    expect(screen.getByText('当前')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '上传新版本' }));
    expect(screen.getByText('为 演示技能 上传新版本')).toBeInTheDocument();
  });
});
