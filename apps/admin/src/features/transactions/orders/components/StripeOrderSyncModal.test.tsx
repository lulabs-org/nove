import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Order } from '../types';
import { StripeOrderSyncModal } from './StripeOrderSyncModal';
import { stripeOrderSyncApi } from '../api/stripeOrderSyncApi';

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

vi.mock('../api/stripeOrderSyncApi', () => ({
  stripeOrderSyncApi: {
    historySync: vi.fn(),
    syncSingle: vi.fn(),
  },
}));

describe('StripeOrderSyncModal', () => {
  const onCancel = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits batch sync by default and calls historySync API', async () => {
    const user = userEvent.setup();
    vi.mocked(stripeOrderSyncApi.historySync).mockResolvedValue({
      success: true,
      result: { enqueued: true, jobId: 'job-1', message: 'Task dispatched' },
    });

    render(<StripeOrderSyncModal open onCancel={onCancel} onSuccess={onSuccess} />);

    expect(screen.getByText('Stripe 交易订单数据同步')).toBeInTheDocument();
    expect(screen.getByText('按时间范围批量拉取')).toBeInTheDocument();

    const okButton = screen.getByRole('button', { name: '提交同步任务' });
    await user.click(okButton);

    await waitFor(() => {
      expect(stripeOrderSyncApi.historySync).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });

  it('switches to single sync mode and submits single transaction sync', async () => {
    const user = userEvent.setup();
    vi.mocked(stripeOrderSyncApi.syncSingle).mockResolvedValue({
      success: true,
      result: { action: 'created', order: { id: 'order-1' } as Order },
    });

    render(<StripeOrderSyncModal open onCancel={onCancel} onSuccess={onSuccess} />);

    // Switch to single mode
    const singleTab = screen.getByText('按单号即时同步');
    await user.click(singleTab);

    expect(screen.getByText('Stripe 外部交易编号')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/例如 pi_/);
    fireEvent.change(input, { target: { value: 'pi_123456789' } });

    const okButton = screen.getByRole('button', { name: '立即同步单笔' });
    await user.click(okButton);

    await waitFor(() => {
      expect(stripeOrderSyncApi.syncSingle).toHaveBeenCalledWith('pi_123456789');
      expect(onSuccess).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
