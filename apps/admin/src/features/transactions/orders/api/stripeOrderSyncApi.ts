import { mutator } from '../../../../shared/lib/api/mutator';
import type { Order } from '../types';

export interface StripeOrderHistorySyncParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface StripeSyncResult<T = unknown> {
  success: boolean;
  result: T;
}

export const stripeOrderSyncApi = {
  /**
   * 触发 Stripe 历史订单批量同步（后台 BullMQ 队列执行）
   */
  historySync(
    data: StripeOrderHistorySyncParams
  ): Promise<StripeSyncResult<{ enqueued: boolean; jobId: string; message: string }>> {
    return mutator({
      url: '/stripe/orders/history-sync',
      method: 'POST',
      data,
    });
  },

  /**
   * 单笔同步指定的 Stripe PaymentIntent (pi_xxx)、CheckoutSession (cs_xxx) 或 Charge (ch_xxx)
   */
  syncSingle(
    externalId: string
  ): Promise<StripeSyncResult<{ action: 'created' | 'updated'; order: Order }>> {
    return mutator({
      url: `/stripe/orders/sync/${encodeURIComponent(externalId.trim())}`,
      method: 'POST',
    });
  },
};
