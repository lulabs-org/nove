import Select from 'antd/es/select';
import { useEffect, useMemo, useState } from 'react';
import { orderApi } from '../../orders/api/orderApi';
import type { RefundOrder } from '../types';

interface Props {
  value?: string;
  onChange?: (value?: string) => void;
  initialOrder?: RefundOrder | null;
}

function label(order: { orderCode: string; orderNumber: string; productName?: string | null }) {
  return `${order.orderCode} · ${order.orderNumber}${order.productName ? ` · ${order.productName}` : ''}`;
}

export function RefundOrderSelect({ value, onChange, initialOrder }: Props) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<
    Array<{ id: string; orderCode: string; orderNumber: string; productName?: string | null }>
  >([]);

  useEffect(() => {
    if (initialOrder)
      setOrders((items) => [initialOrder, ...items.filter((item) => item.id !== initialOrder.id)]);
  }, [initialOrder]);

  const search = async (keyword?: string) => {
    setLoading(true);
    try {
      const result = await orderApi.list({ page: 1, pageSize: 20, keyword });
      setOrders(result.data);
    } finally {
      setLoading(false);
    }
  };

  const options = useMemo(
    () => orders.map((order) => ({ value: order.id, label: label(order) })),
    [orders]
  );

  return (
    <Select
      showSearch
      allowClear
      filterOption={false}
      value={value || undefined}
      options={options}
      loading={loading}
      placeholder="搜索订单号或客户"
      onDropdownVisibleChange={(open) => open && orders.length === 0 && void search()}
      onSearch={(keyword) => void search(keyword)}
      onChange={onChange}
    />
  );
}
