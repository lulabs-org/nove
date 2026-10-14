import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfitDashboard } from './ProfitDashboard';

const mocks = vi.hoisted(() => ({
  getHistoricalStats: vi.fn(),
  getDashboardStats: vi.fn(),
}));

vi.mock('../payslips/api/payslipApi', () => ({
  payslipApi: {
    getHistoricalStats: mocks.getHistoricalStats,
  },
}));

vi.mock('../records/api/recordApi', () => ({
  recordApi: {
    getDashboardStats: mocks.getDashboardStats,
  },
}));

vi.mock('./components/MultiMemberCompareView', () => ({
  MultiMemberCompareView: () => <div>全员视图</div>,
}));

vi.mock('./components/SingleMemberDrilldownView', () => ({
  SingleMemberDrilldownView: (props: {
    months: Array<{ totalGrossAmount: number }>;
    selectedMemberId: string;
  }) => (
    <div data-testid="single-member-view">
      {props.selectedMemberId}:{props.months[0]?.totalGrossAmount ?? 'empty'}
    </div>
  ),
}));

vi.mock('./components/MonthlyOperationsView', () => ({
  MonthlyOperationsView: () => <div>经营视图</div>,
}));

const createHistoricalResponse = (totalGrossAmount: number) => ({
  months: [
    {
      month: '2026-09',
      label: '9月',
      baseSalaryAmount: totalGrossAmount,
      commissionAmount: 0,
      bonusAmount: 0,
      subsidyAmount: 0,
      deductionAmount: 0,
      totalGrossAmount,
      settledAmount: totalGrossAmount,
      pendingAmount: 0,
      memberCount: totalGrossAmount > 0 ? 1 : 0,
    },
  ],
  overall: {
    totalGrossAmount,
    totalSettledAmount: totalGrossAmount,
    totalPendingAmount: 0,
    avgMonthlyGross: totalGrossAmount,
    maxMonthlyGross: totalGrossAmount,
  },
  categoryTotals: {
    baseSalaryAmount: totalGrossAmount,
    commissionAmount: 0,
    bonusAmount: 0,
    subsidyAmount: 0,
    deductionAmount: 0,
  },
  members: [{ id: 'member-without-data', name: '无数据员工' }],
  memberSeries: [],
});

describe('ProfitDashboard', () => {
  beforeAll(() => {
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
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDashboardStats.mockResolvedValue({
      month: '2026-09',
      totalOrders: 0,
      totalSettled: 0,
      totalPending: 0,
      totalClawback: 0,
      moduleStats: [],
      memberRankings: [],
    });
    mocks.getHistoricalStats.mockImplementation((params: { memberId?: string }) =>
      Promise.resolve(createHistoricalResponse(params.memberId ? 0 : 5_300_000))
    );
  });

  it('loads employee-filtered statistics before rendering the personal view', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfitDashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText('全员视图')).toBeInTheDocument();
    fireEvent.click(screen.getByText('员工个人薪酬透视'));

    await waitFor(() =>
      expect(mocks.getHistoricalStats).toHaveBeenCalledWith({
        memberId: 'member-without-data',
        months: 6,
      })
    );
    expect(await screen.findByTestId('single-member-view')).toHaveTextContent(
      'member-without-data:0'
    );
  });
});
