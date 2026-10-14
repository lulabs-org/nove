import type { TableQueryResult } from '../../../shared/hooks/useTableQuery';

export interface Channel {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
  sortField?: 'createdAt' | 'updatedAt' | 'name' | 'code';
  sortOrder?: 'asc' | 'desc';
}

export type ChannelListData = TableQueryResult<Channel> & { totalPages?: number };

export interface CreateChannel {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export type UpdateChannel = Partial<CreateChannel>;
