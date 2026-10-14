export type RuleType = 'ORDER_PERCENTAGE' | 'FIXED_MONTHLY';
export type AllocationMode = 'FIXED' | 'ORDER_OWNER' | 'FINANCIAL_CLOSER';

export interface ProfitSharingAllocation {
  id?: string;
  memberId?: string | null;
  roleId?: string | null;
  allocationRatio?: number;
  fixedAmount?: number; // 单位：分
}

export interface ProfitSharingModule {
  id?: string;
  name: string;
  shareRatio?: number;
  fixedAmount?: number; // 单位：分
  isRefundable?: boolean;
  amortizationType?: 'NONE' | 'MONTHLY' | 'END_OF_TERM';
  allocationMode?: AllocationMode;
  allocations?: ProfitSharingAllocation[];
}

export interface ProfitSharingRule {
  id: string;
  name: string;
  ruleType?: RuleType;
  productId?: string | null;
  channelId?: number | null;
  validStartTime: string;
  validEndTime: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  modules: ProfitSharingModule[];
}

export interface RuleWritePayload {
  name: string;
  ruleType?: RuleType;
  productId?: string;
  channelId?: number;
  validStartTime: string;
  validEndTime: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  modules: {
    id?: string;
    name: string;
    shareRatio?: number;
    fixedAmount?: number;
    isRefundable?: boolean;
    amortizationType?: 'NONE' | 'MONTHLY' | 'END_OF_TERM';
    allocationMode?: AllocationMode;
    allocations?: {
      id?: string;
      memberId?: string;
      roleId?: string;
      allocationRatio?: number;
      fixedAmount?: number;
    }[];
  }[];
}
