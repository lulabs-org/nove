import { useQuery } from '@tanstack/react-query';
import Select from 'antd/es/select';
import { useEffect, useMemo, useState } from 'react';
import { orderApi } from '../api/orderApi';
import type { OrderRelation } from '../types';
import { mergeOrderProductOptions } from './orderProductOptions';

interface OrderProductSelectProps {
  value?: string;
  onChange?: (value?: string) => void;
  initialProduct?: OrderRelation | null;
}

export function OrderProductSelect({ value, onChange, initialProduct }: OrderProductSelectProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const productsQuery = useQuery({
    queryKey: ['order-product-options', debouncedSearch],
    queryFn: () => orderApi.searchProducts(debouncedSearch),
    staleTime: 30_000,
  });

  const options = useMemo(
    () => mergeOrderProductOptions(productsQuery.data?.items ?? [], initialProduct),
    [initialProduct, productsQuery.data?.items]
  );

  return (
    <Select
      allowClear
      showSearch
      value={value || undefined}
      options={options}
      placeholder="搜索产品名称或编号"
      filterOption={false}
      loading={productsQuery.isFetching}
      notFoundContent={
        productsQuery.isFetching
          ? '搜索中...'
          : productsQuery.isError
            ? '产品加载失败'
            : '未找到匹配产品'
      }
      onSearch={setSearch}
      onChange={onChange}
    />
  );
}
