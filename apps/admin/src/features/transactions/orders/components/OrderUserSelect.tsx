import { useQuery } from '@tanstack/react-query';
import Select from 'antd/es/select';
import { useEffect, useMemo, useState } from 'react';
import { mutator } from '../../../../shared/lib/api/mutator';
import { orderApi } from '../api/orderApi';
import type { OrderRelation, OrderUserOption } from '../types';
import { mergeOrderUserOptions } from './orderUserOptions';

interface OrderUserSelectProps {
  value?: string;
  onChange?: (value?: string) => void;
  initialUser?: OrderRelation | null;
  placeholder: string;
}

export function OrderUserSelect({
  value,
  onChange,
  initialUser,
  placeholder,
}: OrderUserSelectProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: ['order-user-options', debouncedSearch],
    queryFn: () => orderApi.searchUsers(debouncedSearch),
    staleTime: 30_000,
  });

  const singleUserQuery = useQuery({
    queryKey: ['order-user-single', value],
    queryFn: () => mutator<OrderUserOption>({ url: `/admin/users/${value}`, method: 'GET' }),
    enabled: Boolean(value && !usersQuery.data?.items?.some((u) => u.id === value)),
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    const items = [...(usersQuery.data?.items ?? [])];
    if (singleUserQuery.data && !items.some((u) => u.id === singleUserQuery.data?.id)) {
      items.unshift(singleUserQuery.data);
    }
    return mergeOrderUserOptions(items, initialUser);
  }, [initialUser, usersQuery.data?.items, singleUserQuery.data]);

  return (
    <Select
      allowClear
      showSearch
      value={value || undefined}
      options={options}
      placeholder={placeholder}
      filterOption={false}
      loading={usersQuery.isFetching}
      notFoundContent={
        usersQuery.isFetching ? '搜索中...' : usersQuery.isError ? '用户加载失败' : '未找到匹配用户'
      }
      onSearch={setSearch}
      onChange={onChange}
    />
  );
}
