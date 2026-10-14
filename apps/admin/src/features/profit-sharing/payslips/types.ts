export type PayslipItemCategory = 'BASE_SALARY' | 'COMMISSION' | 'BONUS' | 'SUBSIDY' | 'DEDUCTION';

export interface PayslipSummaryItem {
  memberId: string;
  memberName: string;
  username?: string;
  memberRole?: string;
  departmentName?: string;
  phone?: string;
  month: string;
  // 5大板块金额（分）
  baseSalaryAmount: number; // 底薪/固定课酬
  commissionAmount: number; // 订单提成
  bonusAmount: number; // 各类奖金
  subsidyAmount: number; // 福利补贴
  deductionAmount: number; // 各项扣减
  // 兼容旧字段
  fixedAmount: number;
  clawbackAmount: number;
  // 统计项数
  orderCount: number;
  bonusCount: number;
  subsidyCount: number;
  deductionCount: number;
  // 汇总
  totalGrossAmount: number; // baseSalary + commission + bonus + subsidy - deduction
  settledAmount: number;
  pendingAmount: number;
  status: 'SETTLED' | 'PENDING' | 'PARTIALLY_SETTLED';
}

export interface PayslipMonthStats {
  month: string;
  totalGrossAmount: number; // 分
  totalBaseSalaryAmount: number; // 分
  totalCommissionAmount: number; // 分
  totalBonusAmount: number; // 分
  totalSubsidyAmount: number; // 分
  totalDeductionAmount: number; // 分
  totalSettledAmount: number; // 分
  totalPendingAmount: number; // 分
  totalMembers: number;
}

export interface PayslipListResponse {
  month: string;
  summary: PayslipMonthStats;
  items: PayslipSummaryItem[];
}

export interface PayslipDetailRecord {
  id: string;
  ruleName: string;
  moduleName: string;
  category?: PayslipItemCategory;
  baseAmount: number; // 分
  profitAmount: number; // 分
  status: string;
  settlementTime?: string;
  createdAt: string;
  orderNumber?: string;
  orderAmount?: number; // 分
  channelName?: string;
  remark?: string;
}

export interface PayslipDetailResponse {
  member: {
    id: string;
    name: string;
    username?: string;
    role?: string;
    department?: string;
    phone?: string;
  };
  month: string;
  summary: {
    baseSalaryAmount: number;
    commissionAmount: number;
    bonusAmount: number;
    subsidyAmount: number;
    deductionAmount: number;
    fixedAmount: number;
    clawbackAmount: number;
    orderCount: number;
    bonusCount: number;
    subsidyCount: number;
    deductionCount: number;
    totalGrossAmount: number;
    settledAmount: number;
    pendingAmount: number;
  };
  baseSalaryItems: PayslipDetailRecord[];
  commissionItems: PayslipDetailRecord[];
  bonusItems: PayslipDetailRecord[];
  subsidyItems: PayslipDetailRecord[];
  deductionItems: PayslipDetailRecord[];
  fixedItems?: PayslipDetailRecord[];
  clawbackItems?: PayslipDetailRecord[];
}

export interface CreateAdjustmentPayload {
  memberId: string;
  month: string;
  category: PayslipItemCategory;
  name: string;
  amount: number; // 分
  remark?: string;
}

export interface HistoricalMonthPoint {
  month: string;
  label: string;
  baseSalaryAmount: number;
  commissionAmount: number;
  bonusAmount: number;
  subsidyAmount: number;
  deductionAmount: number;
  totalGrossAmount: number;
  settledAmount: number;
  pendingAmount: number;
  memberCount: number;
}

export interface MemberHistoricalSeries {
  memberId: string;
  memberName: string;
  memberRole?: string;
  departmentName?: string;
  color: string;
  totalGrossAmount: number; // 分
  totalSettledAmount: number;
  totalPendingAmount: number;
  avgMonthlyGross: number; // 分
  monthlyPoints: Array<{
    month: string;
    label: string;
    baseSalaryAmount: number;
    commissionAmount: number;
    bonusAmount: number;
    subsidyAmount: number;
    deductionAmount: number;
    totalGrossAmount: number;
  }>;
}

export interface HistoricalSalaryStatsResponse {
  months: HistoricalMonthPoint[];
  overall: {
    totalGrossAmount: number;
    totalSettledAmount: number;
    totalPendingAmount: number;
    avgMonthlyGross: number;
    maxMonthlyGross: number;
  };
  categoryTotals: {
    baseSalaryAmount: number;
    commissionAmount: number;
    bonusAmount: number;
    subsidyAmount: number;
    deductionAmount: number;
  };
  members: Array<{
    id: string;
    name: string;
    role?: string;
    department?: string;
  }>;
  memberSeries: MemberHistoricalSeries[];
  selectedMember?: {
    id: string;
    name: string;
    role?: string;
    department?: string;
  };
}
