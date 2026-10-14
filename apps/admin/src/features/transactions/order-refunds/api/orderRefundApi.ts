import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  BenefitCalculationPreview,
  CreateOrderRefund,
  OrderRefund,
  OrderRefundListData,
  OrderRefundListParams,
  RefundStatus,
  UpdateOrderRefund,
} from '../types';

interface RawList {
  items?: OrderRefund[];
  data?: OrderRefund[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

function cleanParams(params: OrderRefundListParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null)
  );
}

export const orderRefundApi = {
  async list(params: OrderRefundListParams): Promise<OrderRefundListData> {
    const result = await mutator<RawList>({
      url: '/admin/order-refunds',
      method: 'GET',
      params: cleanParams(params),
    });
    return {
      data: result.items ?? result.data ?? [],
      total: result.total ?? 0,
      page: result.page ?? params.page ?? 1,
      pageSize: result.pageSize ?? params.pageSize ?? 10,
      totalPages: result.totalPages ?? 0,
    };
  },

  get(id: string): Promise<OrderRefund> {
    return mutator<OrderRefund>({ url: `/admin/order-refunds/${id}`, method: 'GET' });
  },

  create(data: CreateOrderRefund): Promise<OrderRefund> {
    return mutator<OrderRefund>({ url: '/admin/order-refunds', method: 'POST', data });
  },

  update(id: string, data: UpdateOrderRefund): Promise<OrderRefund> {
    return mutator<OrderRefund>({ url: `/admin/order-refunds/${id}`, method: 'PUT', data });
  },

  updateStatus(id: string, status: RefundStatus): Promise<OrderRefund> {
    return mutator<OrderRefund>({
      url: `/admin/order-refunds/${id}/status`,
      method: 'PATCH',
      data: { status },
    });
  },

  delete(id: string): Promise<void> {
    return mutator<void>({ url: `/admin/order-refunds/${id}`, method: 'DELETE' });
  },

  previewCalculation(orderId: string, applyAt?: string): Promise<BenefitCalculationPreview> {
    return mutator<BenefitCalculationPreview>({
      url: '/admin/order-refunds/preview-calculation',
      method: 'GET',
      params: { orderId, applyAt: applyAt || undefined },
    });
  },
};
