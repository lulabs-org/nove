import { mutator } from '../../../shared/lib/api/mutator';
import type {
  CreateProject,
  Project,
  ProjectListData,
  ProjectListParams,
  ProjectOwnerListParams,
  ProjectOwnerListResponse,
  ProjectStatus,
  UpdateProject,
} from '../types';

interface RawProjectList {
  items?: Project[];
  data?: Project[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

const cleanParams = (params: ProjectListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));

export const projectApi = {
  async list(params: ProjectListParams): Promise<ProjectListData> {
    const result = await mutator<RawProjectList>({
      url: '/admin/projects',
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

  getById(id: string): Promise<Project> {
    return mutator<Project>({ url: `/admin/projects/${id}`, method: 'GET' });
  },

  ownerOptions(params: ProjectOwnerListParams): Promise<ProjectOwnerListResponse> {
    return mutator<ProjectOwnerListResponse>({
      url: '/admin/projects/owner-options',
      method: 'GET',
      params: cleanParams(params),
    });
  },

  create(data: CreateProject): Promise<Project> {
    return mutator<Project>({
      url: '/admin/projects',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  update(id: string, data: UpdateProject): Promise<Project> {
    return mutator<Project>({
      url: `/admin/projects/${id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return mutator<Project>({
      url: `/admin/projects/${id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: { status },
    });
  },

  delete(id: string): Promise<void> {
    return mutator<void>({ url: `/admin/projects/${id}`, method: 'DELETE' });
  },
};
