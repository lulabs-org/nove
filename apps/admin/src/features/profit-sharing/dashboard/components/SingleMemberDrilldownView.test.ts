import { describe, expect, it } from 'vitest';
import { buildPayslipPath, getStructureInsight } from './singleMemberDrilldownUtils';

describe('SingleMemberDrilldownView helpers', () => {
  it('does not claim that base salary is dominant when every salary category is zero', () => {
    expect(getStructureInsight(0, 0, 0)).toBe('当前周期暂无薪资数据，暂时无法生成结构洞察。');
  });

  it('preserves the selected month and member in the payslip URL', () => {
    expect(buildPayslipPath('2026-05', 'member/zhang-san', '张三')).toBe(
      '/profit-sharing/payslips?month=2026-05&memberId=member%2Fzhang-san&memberName=%E5%BC%A0%E4%B8%89'
    );
  });
});
