import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectManagement } from './ProjectManagement';

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mocks = vi.hoisted(() => ({
  projectList: vi.fn(),
  user: { currentOrgId: null as string | null },
}));

vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mocks.user,
    currentOrgId: mocks.user.currentOrgId,
    checkPermission: () => true,
  }),
}));

vi.mock('../api/projectApi', () => ({
  projectApi: {
    list: mocks.projectList,
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    findOwners: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

vi.mock('../../transactions/products/api/productApi', () => ({
  productApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('ProjectManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.currentOrgId = null;
  });

  it('shows an organization empty state without requesting projects', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectManagement />
      </QueryClientProvider>
    );

    expect(screen.getByText('缺少当前组织')).toBeInTheDocument();
    expect(mocks.projectList).not.toHaveBeenCalled();
  });

  it('renders MarkdownEditor in the create project modal', async () => {
    mocks.user.currentOrgId = 'org-1';
    mocks.projectList.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectManagement />
      </QueryClientProvider>
    );

    const createButton = await screen.findByRole('button', { name: /新增项目/ });
    await user.click(createButton);

    expect(await screen.findByRole('toolbar', { name: 'Markdown 格式工具栏' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        '请输入详细项目介绍，支持 Markdown 语法排版（如标题、列表、加粗、代码块等）'
      )
    ).toBeInTheDocument();
  });
});
