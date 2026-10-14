import { mutator } from '../../../../shared/lib/api/mutator';

export type WechatSyncKind = 'orders' | 'aftersale';
export type WechatSyncTimeField = 'create_time_range' | 'update_time_range';
export type WechatSyncPayload = Partial<
  Record<WechatSyncTimeField, { start_time: string; end_time: string }>
>;
export type WechatSyncPeriod = 'HOURLY' | 'DAILY' | 'WEEKLY';
export interface WechatSyncScheduleInput {
  kinds: WechatSyncKind[];
  period: WechatSyncPeriod;
  intervalHours?: number;
  time?: string;
  weekday?: number;
}
export interface WechatSyncSchedule extends WechatSyncScheduleInput {
  id: string;
  status: string;
  timezone: string;
}

export const wechatShopSyncApi = {
  getSchedule() {
    return mutator<WechatSyncSchedule | null>({
      url: '/wechat-shop/orders/sync-schedule',
      method: 'GET',
    });
  },
  saveSchedule(data: WechatSyncScheduleInput) {
    return mutator<WechatSyncSchedule>({
      url: '/wechat-shop/orders/sync-schedule',
      method: 'PUT',
      data,
    });
  },
  removeSchedule() {
    return mutator<{ ok: true }>({
      url: '/wechat-shop/orders/sync-schedule',
      method: 'DELETE',
    });
  },
  historySync(kind: WechatSyncKind, data: WechatSyncPayload) {
    return mutator<{ success: boolean; result: { enqueuedRangeTasks: number } }>({
      url:
        kind === 'orders'
          ? '/wechat-shop/orders/history-sync'
          : '/wechat-shop/orders/aftersale/history-sync',
      method: 'POST',
      data,
    });
  },
};
