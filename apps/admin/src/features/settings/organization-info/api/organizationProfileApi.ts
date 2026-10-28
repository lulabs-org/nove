import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  OrganizationDto,
  UpdateOrganizationDto,
} from '../../../../shared/lib/api/orval/business/schemas';

export const organizationProfileApi = {
  getProfile(orgId: string, signal?: AbortSignal): Promise<OrganizationDto> {
    return mutator<OrganizationDto>({
      url: `/admin/orgs/${orgId}`,
      method: 'GET',
      signal,
    });
  },

  saveProfile(
    orgId: string,
    values: UpdateOrganizationDto,
    file?: File,
    removeLogo = false
  ): Promise<OrganizationDto> {
    const data = new FormData();
    for (const key of ['name', 'description', 'active'] as const) {
      if (values[key] !== undefined) data.append(key, String(values[key]));
    }
    data.append('logoAction', removeLogo ? 'remove' : 'keep');
    if (file) data.append('file', file);
    return mutator<OrganizationDto>({
      url: `/admin/orgs/${orgId}/profile`,
      method: 'PUT',
      data,
    });
  },

  getQueryKey(orgId: string) {
    return ['organization-profile', orgId] as const;
  },
};

export type { OrganizationDto, UpdateOrganizationDto };
