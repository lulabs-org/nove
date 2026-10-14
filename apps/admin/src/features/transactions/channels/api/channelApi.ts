import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  Channel,
  ChannelListData,
  ChannelListParams,
  CreateChannel,
  UpdateChannel,
} from '../types';

interface RawChannelList {
  items?: Channel[];
  data?: Channel[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

const cleanParams = (params: ChannelListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));

export const channelApi = {
  async list(params: ChannelListParams): Promise<ChannelListData> {
    const result = await mutator<RawChannelList>({
      url: '/admin/channels',
      method: 'GET',
      params: cleanParams(params),
    });
    return {
      data: result.items ?? result.data ?? [],
      total: result.total ?? 0,
      page: result.page ?? params.page ?? 1,
      pageSize: result.pageSize ?? params.pageSize ?? 10,
      totalPages: result.totalPages,
    };
  },

  getById(id: number): Promise<Channel> {
    return mutator<Channel>({ url: `/admin/channels/${id}`, method: 'GET' });
  },

  create(data: CreateChannel): Promise<Channel> {
    return mutator<Channel>({
      url: '/admin/channels',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  update(id: number, data: UpdateChannel): Promise<Channel> {
    return mutator<Channel>({
      url: `/admin/channels/${id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  updateStatus(id: number, isActive: boolean): Promise<Channel> {
    return mutator<Channel>({
      url: `/admin/channels/${id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: { isActive },
    });
  },

  delete(id: number): Promise<void> {
    return mutator<void>({ url: `/admin/channels/${id}`, method: 'DELETE' });
  },
};
