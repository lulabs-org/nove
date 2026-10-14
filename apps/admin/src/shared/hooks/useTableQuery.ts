/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 13:43:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 19:01:53
 * @FilePath: /nove-admin/src/shared/hooks/useTableQuery.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

export interface TableQueryParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
  [key: string]: unknown;
}

export interface TableQueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UseTableQueryOptions<TData, TError> extends Omit<
  UseQueryOptions<TableQueryResult<TData>, TError>,
  'queryKey' | 'queryFn'
> {
  queryKey: string;
  queryFn: (params: TableQueryParams) => Promise<TableQueryResult<TData>>;
  params: TableQueryParams;
}

export function useTableQuery<TData, TError = unknown>({
  queryKey,
  queryFn,
  params,
  ...options
}: UseTableQueryOptions<TData, TError>) {
  const { page = 1, pageSize = 10, ...restParams } = params;

  const queryKeyWithParams = [queryKey, { page, pageSize, ...restParams }] as const;

  return useQuery({
    queryKey: queryKeyWithParams,
    queryFn: () => queryFn({ page, pageSize, ...restParams }),
    ...options,
  });
}

export interface UseTableMutationOptions<TData, TError, TVariables, TContext> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationKey'
> {
  queryKey: string;
  invalidateOnSuccess?: boolean;
}

export function useTableMutation<TData, TError, TVariables, TContext = unknown>({
  queryKey,
  invalidateOnSuccess = true,
  onSuccess,
  ...options
}: UseTableMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    mutationKey: [queryKey],
    ...options,
    onSuccess: (...args) => {
      if (invalidateOnSuccess) {
        queryClient.invalidateQueries({ queryKey: [queryKey], exact: false });
      }
      onSuccess?.(...args);
    },
  });
}

export interface UseTableDeleteMutationOptions<TError, TContext> extends Omit<
  UseMutationOptions<void, TError, string, TContext>,
  'mutationKey'
> {
  queryKey: string;
}

export function useTableDeleteMutation<TError = unknown, TContext = unknown>({
  queryKey,
  onSuccess,
  ...options
}: UseTableDeleteMutationOptions<TError, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<void, TError, string, TContext>({
    mutationKey: [queryKey, 'delete'],
    ...options,
    onSuccess: (data, variables, context, meta) => {
      queryClient.invalidateQueries({ queryKey: [queryKey], exact: false });
      onSuccess?.(data, variables, context, meta);
    },
  });
}
