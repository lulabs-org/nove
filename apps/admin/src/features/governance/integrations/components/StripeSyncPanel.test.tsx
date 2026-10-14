import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { StripeSyncPanel } from './StripeSyncPanel';

vi.mock('../../../../shared/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../../transactions/orders/components/StripeOrderSyncModal', () => ({
  StripeOrderSyncModal: ({ open }: { open: boolean }) => (open ? <div>订单同步弹窗</div> : null),
}));
vi.mock('../../../transactions/order-refunds/components/StripeRefundSyncModal', () => ({
  StripeRefundSyncModal: ({ open }: { open: boolean }) => (open ? <div>退款同步弹窗</div> : null),
}));

function setRoles(roles: string[]) {
  vi.mocked(useAuth).mockReturnValue({ user: { roles } } as ReturnType<typeof useAuth>);
}

describe('StripeSyncPanel', () => {
  it('hides synchronization from users without the backend-required role', () => {
    setRoles(['ADMIN']);
    render(<StripeSyncPanel />);
    expect(screen.queryByText('数据同步')).not.toBeInTheDocument();
  });

  it('opens the selected synchronization flow for super administrators', async () => {
    setRoles(['SUPER_ADMIN']);
    const user = userEvent.setup();
    render(<StripeSyncPanel />);
    await user.click(screen.getByRole('button', { name: '同步订单' }));
    expect(screen.getByText('订单同步弹窗')).toBeInTheDocument();
    expect(screen.queryByText('退款同步弹窗')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '同步退款' }));
    expect(screen.getByText('退款同步弹窗')).toBeInTheDocument();
    expect(screen.queryByText('订单同步弹窗')).not.toBeInTheDocument();
  });
});
