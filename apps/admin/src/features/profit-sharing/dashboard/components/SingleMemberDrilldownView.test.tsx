import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SingleMemberDrilldownView } from './SingleMemberDrilldownView';

describe('SingleMemberDrilldownView structure insight', () => {
  beforeAll(() => {
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

  it.each([
    [0, 0, 0, /当前周期暂无薪资数据，暂时无法生成结构洞察。/],
    [0, 0, 10_000, /当前周期暂无薪资数据，暂时无法生成结构洞察。/],
    [0, -10_000, 0, /当前周期暂无薪资数据，暂时无法生成结构洞察。/],
    [10_000, 20_000, 0, /业绩驱动型收益结构/],
    [20_000, 10_000, 0, /底薪课酬保障型收益结构/],
  ])(
    'shows the expected insight for base salary %i, commission %i, and deduction %i',
    (baseSalaryAmount, commissionAmount, deductionAmount, expectedInsight) => {
      render(
        <MemoryRouter>
          <SingleMemberDrilldownView
            months={[]}
            categoryTotals={{
              baseSalaryAmount,
              commissionAmount,
              bonusAmount: 0,
              subsidyAmount: 0,
              deductionAmount,
            }}
            members={[{ id: 'member-1', name: '测试员工' }]}
            selectedMemberId="member-1"
            monthsCount={6}
            onSelectMember={vi.fn()}
            onMonthsCountChange={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByText(expectedInsight)).toBeInTheDocument();
    }
  );
});
