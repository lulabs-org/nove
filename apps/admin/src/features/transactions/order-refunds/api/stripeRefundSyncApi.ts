import { mutator } from '../../../../shared/lib/api/mutator';
import type { OrderRefund } from '../types';

export interface StripeRefundHistorySyncParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface StripeRefundSyncResult<T = unknown> {
  success: boolean;
  result: T;
}

export const stripeRefundSyncApi = {
  /**
   * 触发 Stripe 历史退款批量同步（后台 BullMQ 队列执行）
   */
  historySync(
    data: StripeRefundHistorySyncParams
  ): Promise<StripeRefundSyncResult<{ enqueued: boolean; jobId: string; message: string }>> {
    return mutator({
      url: '/stripe/refunds/history-sync',
      method: 'POST',
      data,
    });
  },

  /**
   * 单笔同步指定的 Stripe 退款单号 (re_xxx)
   */
  syncSingle(refundId: string): Promise<StripeRefundSyncResult<OrderRefund>> {
    return mutator({
      url: `/stripe/refunds/sync/${encodeURIComponent(refundId.trim())}`,
      method: 'POST',
    });
  },
};
