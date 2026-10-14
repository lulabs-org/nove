import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParentRefundSelect } from './ParentRefundSelect';

const mocks = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }));
vi.mock('../api/orderRefundApi', () => ({ orderRefundApi: mocks }));

function mount(props: Parameters<typeof ParentRefundSelect>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ParentRefundSelect {...props} />
    </QueryClientProvider>
  );
}

const parent = {
  id: 'parent-1',
  afterSaleCode: 'AS-001',
  applicantName: '测试申请人',
  order: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
  mocks.list.mockResolvedValue({ data: [] });
  mocks.get.mockResolvedValue(parent);
});

afterEach(() => vi.unstubAllGlobals());

describe('ParentRefundSelect', () => {
  it('loads the selected record even when it is outside the search results', async () => {
    mount({ value: parent.id });
    expect(await screen.findByText('AS-001 · 测试申请人')).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith(parent.id);
  });

  it('searches remotely, excludes itself, and submits the selected record ID', async () => {
    mocks.list.mockResolvedValue({
      data: [parent, { ...parent, id: 'self', afterSaleCode: 'AS-SELF' }],
    });
    const onChange = vi.fn();
    mount({ excludeId: 'self', onChange });
    const input = screen.getByRole('combobox');
    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: 'AS-001' } });
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith({ page: 1, pageSize: 20, keyword: 'AS-001' })
    );
    expect(screen.queryByText('AS-SELF · 测试申请人')).not.toBeInTheDocument();
    fireEvent.click(await screen.findByText('AS-001 · 测试申请人'));
    expect(onChange.mock.calls[0][0]).toBe(parent.id);
  });
});
