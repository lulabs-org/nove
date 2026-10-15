export const getStructureInsight = (
  totalPositive: number,
  commPercent: number,
  basePercent: number
) => {
  if (totalPositive <= 0) {
    return '当前周期暂无薪资数据，暂时无法生成结构洞察。';
  }

  return commPercent > basePercent
    ? '该员工提成贡献占比高于固定底薪，属于高绩效、高产出的业绩驱动型收益结构。'
    : '该员工固定课酬/底薪贡献占比较高，属于高稳定性、底薪课酬保障型收益结构。';
};

export const buildPayslipPath = (month: string, memberId: string, memberName?: string) => {
  const searchParams = new URLSearchParams({ month, memberId });
  if (memberName) {
    searchParams.set('memberName', memberName);
  }
  return `/profit-sharing/payslips?${searchParams.toString()}`;
};
