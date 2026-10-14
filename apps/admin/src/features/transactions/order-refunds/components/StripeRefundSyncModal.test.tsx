import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { OrderRefund } from '../types';
import { StripeRefundSyncModal } from './StripeRefundSyncModal';
import { stripeRefundSyncApi } from '../api/stripeRefundSyncApi';

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

vi.mock('../api/stripeRefundSyncApi', () => ({
  stripeRefundSyncApi: {
    historySync: vi.fn(),
    syncSingle: vi.fn(),
  },
}));

describe('StripeRefundSyncModal', () => {
  const onCancel = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits batch refund sync by default and calls historySync API', async () => {
    const user = userEvent.setup();
    vi.mocked(stripeRefundSyncApi.historySync).mockResolvedValue({
      success: true,
      result: { enqueued: true, jobId: 'job-ref-1', message: 'Task dispatched' },
    });

    render(<StripeRefundSyncModal open onCancel={onCancel} onSuccess={onSuccess} />);

    expect(screen.getByText('Stripe 售后退款数据同步')).toBeInTheDocument();
    expect(screen.getByText('按时间范围批量拉取')).toBeInTheDocument();

    const okButton = screen.getByRole('button', { name: '提交同步任务' });
    await user.click(okButton);

    await waitFor(() => {
      expect(stripeRefundSyncApi.historySync).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });

  it('switches to single refund sync mode and submits single refund sync', async () => {
    const user = userEvent.setup();
    vi.mocked(stripeRefundSyncApi.syncSingle).mockResolvedValue({
      success: true,
      result: { id: 'ref-1', afterSaleCode: 'REF123456' } as OrderRefund,
    });

    render(<StripeRefundSyncModal open onCancel={onCancel} onSuccess={onSuccess} />);

    // Switch to single mode
    const singleTab = screen.getByText('按退款单号即时同步');
    await user.click(singleTab);

    expect(screen.getByText('Stripe 退款单号')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/例如 re_/);
    fireEvent.change(input, { target: { value: 're_123456789' } });

    const okButton = screen.getByRole('button', { name: '立即同步单笔' });
    await user.click(okButton);

    await waitFor(() => {
      expect(stripeRefundSyncApi.syncSingle).toHaveBeenCalledWith('re_123456789');
      expect(onSuccess).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
