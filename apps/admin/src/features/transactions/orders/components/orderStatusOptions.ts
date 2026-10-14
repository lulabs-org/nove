import type { OrderStatus } from '../types';

export const ORDER_STATUS_OPTIONS: Array<{
  label: string;
  value: OrderStatus;
  color: string;
}> = [
  { label: '未支付', value: 'UNPAID', color: 'default' },
  { label: '已支付', value: 'PAID', color: 'processing' },
  { label: '已冻结', value: 'FROZEN', color: 'cyan' },
  { label: '已取消', value: 'CANCELLED', color: 'warning' },
  { label: '已完成', value: 'COMPLETED', color: 'success' },
];
