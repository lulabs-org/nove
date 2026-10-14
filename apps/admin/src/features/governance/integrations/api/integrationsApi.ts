import { http } from '../../../../shared/lib/api/http';
import type {
  IntegrationConfigMap,
  IntegrationDetail,
  IntegrationModule,
  IntegrationSummary,
  SaveIntegrationResult,
  TestIntegrationResult,
  TestAliyunSmsInput,
} from '../types';

async function list(): Promise<IntegrationSummary[]> {
  const response = await http.get<IntegrationSummary[]>('/admin/integrations');
  return response.data;
}

async function get<M extends IntegrationModule>(
  module: M
): Promise<IntegrationDetail<IntegrationConfigMap[M]>> {
  const response = await http.get<IntegrationDetail<IntegrationConfigMap[M]>>(
    `/admin/integrations/${module}`
  );
  return response.data;
}

async function update<M extends IntegrationModule>(
  module: M,
  data: IntegrationConfigMap[M]
): Promise<SaveIntegrationResult> {
  const response = await http.put<SaveIntegrationResult>(`/admin/integrations/${module}`, data);
  return response.data;
}

async function test<M extends IntegrationModule>(
  module: M,
  data: IntegrationConfigMap[M] & Partial<TestAliyunSmsInput>
): Promise<TestIntegrationResult> {
  const response = await http.post<TestIntegrationResult>(
    `/admin/integrations/${module}/test`,
    data
  );
  return response.data;
}

async function remove(module: IntegrationModule): Promise<SaveIntegrationResult> {
  const response = await http.delete<SaveIntegrationResult>(`/admin/integrations/${module}`);
  return response.data;
}

async function uploadMailBrandLogo(file: Blob): Promise<{ url: string }> {
  const data = new FormData();
  data.append('file', file);
  const response = await http.put<{ url: string }>('/admin/integrations/mail/brand-logo', data);
  return response.data;
}

async function removeMailBrandLogo(): Promise<{ url: null }> {
  const response = await http.delete<{ url: null }>('/admin/integrations/mail/brand-logo');
  return response.data;
}

export const integrationsApi = {
  list,
  get,
  update,
  test,
  remove,
  uploadMailBrandLogo,
  removeMailBrandLogo,
};
