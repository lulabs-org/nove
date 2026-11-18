import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QADataHubPage } from './QADataHubPage';
import { PERMISSIONS } from '../../../shared/utils/permissions';

const state = vi.hoisted(() => ({
  user: { id: 'member-2', currentOrgId: 'org-1' },
  permissions: new Set<string>(),
  api: {
    listSessions: vi.fn(),
    getSession: vi.fn(),
    listRecords: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    createRecord: vi.fn(),
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    submitFeedback: vi.fn(),
  },
}));
vi.mock('../api/qaApi', () => ({ qaApi: state.api }));
vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: state.user,
    checkPermission: (permission: string) => state.permissions.has(permission),
  }),
}));
const dataset = {
  id: 'dataset-1',
  title: '同事的知识库',
  userId: 'member-1',
  orgId: 'org-1',
  targetType: 'GLOBAL',
  targetId: null,
  targetName: null,
  creatorName: '创建成员',
  recordCount: 0,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};
const record = {
  id: 'record-1',
  sessionId: dataset.id,
  question: '如何报名？',
  answer: '请填写申请表。',
  generatedBy: 'HUMAN',
  rating: null,
  citations: [],
};
function page<T>(items: T[], total = items.length, current = 1) {
  return { items, total, page: current, pageSize: 20, totalPages: Math.ceil(total / 20) };
}
let client: QueryClient;
function view(path = '/qa') {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <QADataHubPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  state.user = { id: 'member-2', currentOrgId: 'org-1' };
  state.permissions = new Set(Object.values(PERMISSIONS.QA));
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 300000 }, mutations: { retry: false } },
  });
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
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
  state.api.listSessions.mockResolvedValue(page([dataset]));
  state.api.getSession.mockResolvedValue(dataset);
  state.api.listRecords.mockResolvedValue(page([record]));
});
afterEach(async () => {
  cleanup();
  await client.cancelQueries();
  client.clear();
  vi.unstubAllGlobals();
});

describe('Organization shared knowledge library', () => {
  it('distinguishes similarly named datasets with title-based badges', async () => {
    const titles = ['数据集1', '数据集2', '会话二'];
    state.api.listSessions.mockResolvedValue(
      page(titles.map((title) => ({ ...dataset, id: title, title })))
    );
    render(view());
    for (const [title, symbol] of [
      ['数据集1', '1'],
      ['数据集2', '2'],
      ['会话二', '会'],
    ]) {
      const row = await screen.findByRole('row', { name: new RegExp(title) });
      expect(within(row).getByText(symbol)).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('shows coworkers datasets and requests server pagination beyond the first hundred', async () => {
    state.api.listSessions.mockResolvedValue(page([dataset], 121));
    render(view());
    expect(await screen.findByText(dataset.title)).toBeInTheDocument();
    const row = within(screen.getByRole('row', { name: new RegExp(dataset.title) }));
    expect(row.getByText('创建成员')).toBeInTheDocument();
    expect(row.getByRole('cell', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /新建数据集/ })).toBeInTheDocument();
    expect(screen.queryByText('已就绪')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('7'));
    await waitFor(() =>
      expect(state.api.listSessions).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 7, pageSize: 20 })
      )
    );
  });

  it('restores a linked dataset and prevents editing for read-only members', async () => {
    state.permissions = new Set([PERMISSIONS.QA.SESSION_READ, PERMISSIONS.QA.RECORD_READ]);
    render(view('/qa?dataset=dataset-1'));
    expect(await screen.findByText(record.question)).toBeInTheDocument();
    expect(state.api.getSession).toHaveBeenCalledWith('dataset-1');
    expect(screen.queryByRole('button', { name: '编辑问答' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除问答' })).not.toBeInTheDocument();
    expect(screen.queryByText('已索引')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(record.question));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers dataset editing only in the dataset list', async () => {
    render(view());
    const title = await screen.findByText(dataset.title);
    expect(screen.getByRole('button', { name: '编辑数据集' })).toBeInTheDocument();
    fireEvent.click(title);
    await screen.findByText(record.question);
    expect(screen.queryByRole('button', { name: /编辑数据集/ })).not.toBeInTheDocument();
  });

  it('does not request or display record content without record read permission', async () => {
    state.permissions = new Set([PERMISSIONS.QA.SESSION_READ]);
    render(view('/qa?dataset=dataset-1'));
    expect(
      await screen.findByText('你可以查看数据集信息，但没有查看问答内容的权限。')
    ).toBeInTheDocument();
    expect(state.api.listRecords).not.toHaveBeenCalled();
  });

  it('keeps loading failures distinct from an empty dataset', async () => {
    state.api.listRecords.mockRejectedValue(new Error('offline'));
    render(view('/qa?dataset=dataset-1'));
    expect(await screen.findByText('问答加载失败')).toBeInTheDocument();
    expect(screen.queryByText('当前数据集还没有问答数据')).not.toBeInTheDocument();
    state.api.listRecords.mockResolvedValue(page([]));
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));
    expect(await screen.findByText('当前数据集还没有问答数据')).toBeInTheDocument();
  });

  it('does not reuse the previous account or organization cache', async () => {
    const rendered = render(view());
    expect(await screen.findByText(dataset.title)).toBeInTheDocument();
    state.user = { id: 'member-3', currentOrgId: 'org-2' };
    state.api.listSessions.mockResolvedValue(
      page([{ ...dataset, id: 'other', title: '另一个组织' }])
    );
    rendered.rerender(view());
    expect(screen.queryByText(dataset.title)).not.toBeInTheDocument();
    expect(await screen.findByText('另一个组织')).toBeInTheDocument();
    expect(state.api.listSessions).toHaveBeenCalledTimes(2);
  });

  it('returns to page one if another member removes the only result on page two', async () => {
    state.api.listRecords.mockImplementation((params: { page: number }) =>
      Promise.resolve(
        page(
          [{ ...record, id: `record-${params.page}`, question: `第 ${params.page} 页问答` }],
          21,
          params.page
        )
      )
    );
    render(view('/qa?dataset=dataset-1'));
    await screen.findByText('第 1 页问答');
    fireEvent.click(screen.getByTitle('2'));
    await screen.findByText('第 2 页问答');
    state.api.listRecords.mockImplementation((params: { page: number }) =>
      Promise.resolve(page(params.page === 1 ? [record] : [], 20, params.page))
    );
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['qa', 'org-1', 'member-2', 'records'] });
    });
    expect(await screen.findByText(record.question)).toBeInTheDocument();
    expect(state.api.listRecords).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('saves manual edits and refreshes dataset metadata as well as records', async () => {
    state.api.updateRecord.mockResolvedValue(record);
    render(view('/qa?dataset=dataset-1'));
    await screen.findByText(record.question);
    fireEvent.click(screen.getByRole('button', { name: '编辑问答' }));
    fireEvent.change(screen.getByLabelText('答案'), { target: { value: '新的共享答案' } });
    fireEvent.click(screen.getByRole('button', { name: '更新数据' }));
    await waitFor(() =>
      expect(state.api.updateRecord).toHaveBeenCalledWith('record-1', {
        question: record.question,
        answer: '新的共享答案',
      })
    );
    await waitFor(() => expect(state.api.getSession).toHaveBeenCalledTimes(2));
  });
});
