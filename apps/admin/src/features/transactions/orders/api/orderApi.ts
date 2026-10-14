import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  CreateOrder,
  ExtendOrderPayload,
  FreezeOrderPayload,
  Order,
  OrderBenefitAdjustment,
  OrderChannelOptionList,
  OrderListData,
  OrderListParams,
  OrderProductOptionList,
  OrderStatus,
  OrderUserOptionList,
  UnfreezeOrderPayload,
  UpdateOrder,
} from '../types';

interface RawOrderList {
  items?: Order[];
  data?: Order[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

function cleanParams(params: OrderListParams) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null
    )
  );
}

export const orderApi = {
  searchChannels(keyword?: string): Promise<OrderChannelOptionList> {
    return mutator<OrderChannelOptionList>({
      url: '/admin/channels',
      method: 'GET',
      params: {
        page: 1,
        pageSize: 50,
        isActive: true,
        keyword: keyword || undefined,
      },
    });
  },

  searchProducts(keyword?: string): Promise<OrderProductOptionList> {
    return mutator<OrderProductOptionList>({
      url: '/admin/products',
      method: 'GET',
      params: {
        page: 1,
        pageSize: 50,
        status: 'ACTIVE',
        keyword: keyword || undefined,
      },
    });
  },

  searchUsers(keyword?: string): Promise<OrderUserOptionList> {
    return mutator<OrderUserOptionList>({
      url: '/admin/users',
      method: 'GET',
      params: {
        page: 1,
        pageSize: 50,
        active: true,
        keyword: keyword || undefined,
      },
    });
  },

  async list(params: OrderListParams): Promise<OrderListData> {
    const result = await mutator<RawOrderList>({
      url: '/admin/orders',
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

  create(data: CreateOrder): Promise<Order> {
    return mutator<Order>({
      url: '/admin/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  update(id: string, data: UpdateOrder): Promise<Order> {
    return mutator<Order>({
      url: `/admin/orders/${id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return mutator<Order>({
      url: `/admin/orders/${id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: { status },
    });
  },

  delete(id: string): Promise<void> {
    return mutator<void>({
      url: `/admin/orders/${id}`,
      method: 'DELETE',
    });
  },

  freeze(id: string, data: FreezeOrderPayload): Promise<Order> {
    return mutator<Order>({
      url: `/admin/orders/${id}/freeze`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  unfreeze(id: string, data: UnfreezeOrderPayload): Promise<Order> {
    return mutator<Order>({
      url: `/admin/orders/${id}/unfreeze`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  extend(id: string, data: ExtendOrderPayload): Promise<Order> {
    return mutator<Order>({
      url: `/admin/orders/${id}/extend`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  getBenefitAdjustments(id: string): Promise<OrderBenefitAdjustment[]> {
    return mutator<OrderBenefitAdjustment[]>({
      url: `/admin/orders/${id}/benefit-adjustments`,
      method: 'GET',
    });
  },
};
