import { http } from '../../../shared/lib/api/http';
import type {
  OrganizationDto,
  UpdateOrganizationDto,
} from '../../../shared/lib/api/orval/business/schemas';

export async function saveOrganizationProfile(
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
  const response = await http.put<OrganizationDto>(`/admin/orgs/${orgId}/profile`, data);
  return response.data;
}
