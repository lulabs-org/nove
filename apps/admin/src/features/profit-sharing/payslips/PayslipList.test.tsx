import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SingleMemberDrilldownView } from '../dashboard/components/SingleMemberDrilldownView';
import { PayslipList } from './PayslipList';
import { payslipApi } from './api/payslipApi';
import type { PayslipListResponse } from './types';

vi.mock('./api/payslipApi', () => ({ payslipApi: { list: vi.fn() } }));

const amounts = {
  baseSalaryAmount: 0,
  commissionAmount: 0,
  bonusAmount: 0,
  subsidyAmount: 0,
  deductionAmount: 0,
};

describe('PayslipList drilldown filters', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('carries the employee and row month into the ledger and clears only the employee filter', async () => {
    const month = '2026-08';
    const member = { id: 'employee-1', name: '测试员工' };
    const response: PayslipListResponse = {
      month,
      items: [],
      summary: {
        month,
        totalGrossAmount: 0,
        totalBaseSalaryAmount: 0,
        totalCommissionAmount: 0,
        totalBonusAmount: 0,
        totalSubsidyAmount: 0,
        totalDeductionAmount: 0,
        totalSettledAmount: 0,
        totalPendingAmount: 0,
        totalMembers: 0,
      },
    };
    vi.mocked(payslipApi.list).mockResolvedValue(response);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/profit-sharing/dashboard']}>
          <Routes>
            <Route
              path="/profit-sharing/dashboard"
              element={
                <SingleMemberDrilldownView
                  months={[
                    {
                      ...amounts,
                      month,
                      label: '8月',
                      totalGrossAmount: 0,
                      settledAmount: 0,
                      pendingAmount: 0,
                      memberCount: 0,
                    },
                  ]}
                  categoryTotals={amounts}
                  members={[member]}
                  selectedMember={member}
                  selectedMemberId={member.id}
                  monthsCount={6}
                  onSelectMember={vi.fn()}
                  onMonthsCountChange={vi.fn()}
                />
              }
            />
            <Route path="/profit-sharing/payslips" element={<PayslipList />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /查看工资条/ }));
    expect(await screen.findByDisplayValue(month)).toBeInTheDocument();
    expect(screen.getByText('员工：测试员工')).toBeInTheDocument();
    await waitFor(() =>
      expect(payslipApi.list).toHaveBeenCalledWith({ month, memberId: member.id })
    );

    fireEvent.click(screen.getByRole('button', { name: '清除员工筛选' }));
    expect(screen.getByDisplayValue(month)).toBeInTheDocument();
    expect(screen.queryByText('员工：测试员工')).not.toBeInTheDocument();
    await waitFor(() => expect(payslipApi.list).toHaveBeenLastCalledWith({ month }));
  });
});
