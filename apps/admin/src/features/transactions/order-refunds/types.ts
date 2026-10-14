import type { Currency } from '../orders/types';
import type { TableQueryParams } from '../../../shared/hooks/useTableQuery';

export type RefundStatus = 'PENDING' | 'SETTLED';
export type RefundChannel =
  | 'DOUYIN'
  | 'ALIPAY'
  | 'WECHAT'
  | 'STRIPE'
  | 'PAYPAL'
  | 'MANUAL'
  | 'OTHER';

export interface RefundOrder {
  id: string;
  orderCode: string;
  orderNumber: string;
  productName: string | null;
  amount: number;
  currency: Currency;
  email: string | null;
  phone: string | null;
}

export interface RefundCreator {
  id: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
}

export interface OrderRefund {
  id: string;
  afterSaleCode: string;
  orderId: string | null;
  refundChannel: RefundChannel | null;
  approvalUrl: string | null;
  createdBy: string | null;
  refundAmount: number | null;
  refundReason: string | null;
  benefitUsedDays: number | null;
  applicantName: string | null;
  status: RefundStatus;
  financialNote: string | null;
  parentId: string | null;
  productCategory: string | null;
  submittedAt: string | null;
  refundedAt: string | null;
  financialSettledAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  order: RefundOrder | null;
  creator: RefundCreator | null;
}

export interface CreateOrderRefund {
  afterSaleCode: string;
  orderId?: string;
  refundChannel?: RefundChannel;
  approvalUrl?: string;
  refundAmount?: number;
  refundReason?: string;
  benefitUsedDays?: number;
  applicantName?: string;
  financialNote?: string;
  parentId?: string;
  productCategory?: string;
  submittedAt?: string;
}

export type UpdateOrderRefund = Omit<Partial<CreateOrderRefund>, 'afterSaleCode'>;

export interface OrderRefundListParams extends TableQueryParams {
  keyword?: string;
  status?: RefundStatus;
  refundChannel?: RefundChannel;
  submittedFrom?: string;
  submittedTo?: string;
}

export interface OrderRefundListData {
  data: OrderRefund[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BenefitCalculationPreview {
  benefitStart: string | null;
  applyAt: string;
  naturalDays: number;
  totalFrozenDays: number;
  isCurrentlyFrozen: boolean;
  effectiveUsedDays: number;
  remainingDays: number;
  suggestedRefundAmount: number;
}
