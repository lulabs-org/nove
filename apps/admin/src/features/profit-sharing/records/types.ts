export interface ProfitSharingRecord {
  id: string;
  orderId?: string | null;
  periodMonth?: string | null;
  memberId: string;
  memberName?: string;
  memberRole?: string;
  order?: {
    orderNumber: string;
    amount: number;
    financialClosedAt?: string;
  } | null;
  module?: {
    name: string;
  };
  rule?: {
    id: string;
    name: string;
    validStartTime?: string;
    validEndTime?: string;
  };
  ruleSnapshot?: Record<string, unknown>;
  baseAmount: number;
  profitAmount: number;
  settlementTime?: string;
  status: string;
  createdAt: string;
}

export interface ProfitSharingModuleStat {
  name: string;
  percent: number;
  amount: number;
}

export interface ProfitSharingMemberRanking {
  name: string;
  role: string;
  amount: number;
}

export interface ProfitSharingDashboardStats {
  month?: string;
  totalOrders: number;
  totalSettled: number;
  totalPending: number;
  totalClawback: number;
  moduleStats: ProfitSharingModuleStat[];
  memberRankings: ProfitSharingMemberRanking[];
}
