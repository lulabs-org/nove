import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { wechatShopSyncApi } from '../api/wechatShopSyncApi';
import { WechatShopSyncPanel } from './WechatShopSyncPanel';

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

vi.mock('../../../../shared/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../api/wechatShopSyncApi', () => ({
  wechatShopSyncApi: {
    historySync: vi.fn(),
    getSchedule: vi.fn(),
    saveSchedule: vi.fn(),
    removeSchedule: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ user: { roles: ['SUPER_ADMIN'] } } as ReturnType<
    typeof useAuth
  >);
  vi.mocked(wechatShopSyncApi.historySync).mockResolvedValue({
    success: true,
    result: { enqueuedRangeTasks: 1 },
  });
  vi.mocked(wechatShopSyncApi.getSchedule).mockResolvedValue(null);
});

it('hides sync controls from non-super administrators', () => {
  vi.mocked(useAuth).mockReturnValue({ user: { roles: ['ADMIN'] } } as ReturnType<typeof useAuth>);
  render(<WechatShopSyncPanel />);
  expect(screen.queryByText('数据同步')).not.toBeInTheDocument();
});

it('requires a time range before submitting', async () => {
  const user = userEvent.setup();
  render(<WechatShopSyncPanel />);
  await user.click(screen.getByRole('button', { name: '提交同步任务' }));
  expect(await screen.findByText('请选择时间范围')).toBeInTheDocument();
  expect(wechatShopSyncApi.historySync).not.toHaveBeenCalled();
});

it('saves a daily schedule for selected data', async () => {
  const user = userEvent.setup();
  vi.mocked(wechatShopSyncApi.saveSchedule).mockResolvedValue({
    id: 'schedule-1',
    status: 'SCHEDULED',
    timezone: 'Asia/Shanghai',
    kinds: ['orders'],
    period: 'DAILY',
    time: '02:00',
  });
  render(<WechatShopSyncPanel />);
  await user.click(screen.getByRole('tab', { name: '定时同步' }));
  await user.click(screen.getByRole('checkbox', { name: /售后单/ }));
  await user.click(screen.getByRole('button', { name: '开启定时同步' }));
  await waitFor(() =>
    expect(wechatShopSyncApi.saveSchedule).toHaveBeenCalledWith({
      kinds: ['orders'],
      period: 'DAILY',
      time: '02:00',
    })
  );
  expect(await screen.findByText('运行中')).toBeInTheDocument();
});

it('offers weekday and execution time for weekly sync', async () => {
  const user = userEvent.setup();
  render(<WechatShopSyncPanel />);
  await user.click(screen.getByRole('tab', { name: '定时同步' }));
  await user.click(screen.getByRole('combobox', { name: /同步周期/ }));
  await user.click(screen.getByText('每周'));
  expect(screen.getByText('星期')).toBeInTheDocument();
  expect(screen.getByLabelText(/执行时间/)).toBeInTheDocument();
});

describe.each([
  ['订单', 'orders'],
  ['售后单', 'aftersale'],
] as const)('%s', (label, kind) => {
  it('submits only the selected time basis with ISO dates', async () => {
    const user = userEvent.setup();
    render(<WechatShopSyncPanel />);
    await user.click(screen.getByText(label, { exact: true }));
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('更新时间'));
    await user.click(screen.getByPlaceholderText('开始日期'));
    await user.click(screen.getByText('最近 7 天'));
    await user.click(screen.getByRole('button', { name: '提交同步任务' }));
    await waitFor(() =>
      expect(wechatShopSyncApi.historySync).toHaveBeenCalledWith(kind, {
        update_time_range: {
          start_time: expect.stringMatching(/Z$/),
          end_time: expect.stringMatching(/Z$/),
        },
      })
    );
  });
});
