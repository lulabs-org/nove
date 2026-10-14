import type { TableQueryParams } from '../../../shared/hooks/useTableQuery';

export type Currency =
  | 'CNY'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'HKD'
  | 'TWD'
  | 'SGD'
  | 'AUD'
  | 'CAD';

export type OrderStatus = 'UNPAID' | 'PAID' | 'FROZEN' | 'CANCELLED' | 'COMPLETED';

export type PaymentProvider =
  | 'STRIPE'
  | 'PAYPAL'
  | 'WECHAT'
  | 'ALIPAY'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'OTHER';

export interface OrderRelation {
  id: string | number;
  code?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface OrderUserOption {
  id: string;
  username: string | null;
  email: string | null;
  countryCode: string | null;
  phone: string | null;
  displayName?: string | null;
  fullName?: string | null;
}

export interface OrderUserOptionList {
  items: OrderUserOption[];
}

export interface OrderProductOption {
  id: string;
  productCode: string;
  name: string;
  price: number | null;
  currency: Currency;
}

export interface OrderProductOptionList {
  items: OrderProductOption[];
}

export interface OrderChannelOption {
  id: number;
  name: string;
  code: string;
}

export interface OrderChannelOptionList {
  items: OrderChannelOption[];
}

export interface Order {
  id: string;
  orderCode: string;
  orderNumber: string;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  productId: string | null;
  productName: string | null;
  purchaserId: string | null;
  channelId: number | null;
  email: string | null;
  phone: string | null;
  phoneCode: string | null;
  currentOwnerId: string | null;
  financialCloserId: string | null;
  financialClosedAt: string | null;
  amount: number;
  currency: Currency;
  amountCny: number | null;
  fxRateToCny: string | null;
  fxLockedAt: string | null;
  status: OrderStatus;
  paidAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  durationDays: number | null;
  benefitStart: string | null;
  benefitEnd: string | null;
  frozenDays: number;
  frozenAt: string | null;
  paymentProvider: PaymentProvider | null;
  providerTradeNo: string | null;
  product: OrderRelation | null;
  purchaser: OrderRelation | null;
  channel: OrderRelation | null;
  currentOwner: OrderRelation | null;
  financialCloser: OrderRelation | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateOrder {
  orderCode?: string;
  orderNumber?: string;
  externalId?: string;
  productId?: string;
  productName?: string;
  purchaserId?: string;
  channelId?: number;
  email?: string;
  phone?: string;
  phoneCode?: string;
  currentOwnerId?: string | null;
  financialCloserId?: string;
  financialClosedAt?: string;
  amount: number;
  currency?: Currency;
  amountCny?: number;
  status?: OrderStatus;
  paidAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  durationDays?: number;
  benefitStart?: string;
  benefitEnd?: string;
  paymentProvider?: PaymentProvider;
  providerTradeNo?: string;
}

export type UpdateOrder = Partial<CreateOrder>;

export interface OrderListParams extends TableQueryParams {
  keyword?: string;
  status?: OrderStatus;
  currency?: Currency;
  paymentProvider?: PaymentProvider;
  channelId?: number;
  productId?: string;
  purchaserId?: string;
  currentOwnerId?: string;
  paidFrom?: string;
  paidTo?: string;
  createdFrom?: string;
  createdTo?: string;
  includeDeleted?: boolean;
}

export interface OrderListData {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type BenefitAdjustmentType = 'FREEZE' | 'UNFREEZE' | 'EXTENSION';

export interface OrderBenefitAdjustment {
  id: string;
  orderId: string;
  type: BenefitAdjustmentType;
  days: number;
  freezeStart: string | null;
  freezeEnd: string | null;
  beforeEnd: string;
  afterEnd: string;
  reason: string | null;
  operatorId: string | null;
  operator?: OrderRelation | null;
  createdAt: string;
}

export interface FreezeOrderPayload {
  reason?: string;
}

export interface UnfreezeOrderPayload {
  reason?: string;
}

export interface ExtendOrderPayload {
  days: number;
  reason?: string;
}
