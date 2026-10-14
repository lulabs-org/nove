import { useQuery } from '@tanstack/react-query';
import Select from 'antd/es/select';
import { useEffect, useState } from 'react';
import { orderRefundApi } from '../api/orderRefundApi';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  excludeId?: string;
}

export function ParentRefundSelect({ value, onChange, excludeId }: Props) {
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const results = useQuery({
    queryKey: ['parent-refund-options', keyword],
    queryFn: () => orderRefundApi.list({ page: 1, pageSize: 20, keyword }),
    staleTime: 30_000,
  });
  const selected = useQuery({
    queryKey: ['parent-refund-detail', value],
    queryFn: () => orderRefundApi.get(value!),
    enabled: !!value && value !== excludeId,
    staleTime: 30_000,
  });

  const records = new Map((results.data?.data ?? []).map((record) => [record.id, record]));
  if (selected.data) records.set(selected.data.id, selected.data);
  if (excludeId) records.delete(excludeId);
  const options = [...records.values()].map((record) => ({
    value: record.id,
    label: [record.afterSaleCode, record.applicantName, record.order?.orderNumber]
      .filter(Boolean)
      .join(' · '),
  }));
  if (value && value !== excludeId && !records.has(value)) {
    options.push({
      value,
      label: selected.isError ? '关联退款记录加载失败' : '正在加载关联退款记录…',
    });
  }

  return (
    <Select
      showSearch
      value={value || undefined}
      options={options}
      filterOption={false}
      placeholder="搜索售后编号、订单号或申请人"
      loading={results.isFetching || selected.isFetching}
      notFoundContent={
        results.isFetching ? '搜索中…' : results.isError ? '退款记录加载失败' : '未找到匹配退款记录'
      }
      onSearch={setSearch}
      onChange={onChange}
    />
  );
}
