import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  IntegrationConfigMap,
  IntegrationDetail,
  IntegrationModule,
  IntegrationSummary,
  SaveIntegrationResult,
  TestIntegrationResult,
  TestAliyunSmsInput,
} from '../types';

function list(): Promise<IntegrationSummary[]> {
  return mutator<IntegrationSummary[]>({
    url: '/admin/integrations',
    method: 'GET',
  });
}

function get<M extends IntegrationModule>(
  module: M
): Promise<IntegrationDetail<IntegrationConfigMap[M]>> {
  return mutator<IntegrationDetail<IntegrationConfigMap[M]>>({
    url: `/admin/integrations/${module}`,
    method: 'GET',
  });
}

function update<M extends IntegrationModule>(
  module: M,
  data: IntegrationConfigMap[M]
): Promise<SaveIntegrationResult> {
  return mutator<SaveIntegrationResult>({
    url: `/admin/integrations/${module}`,
    method: 'PUT',
    data,
  });
}

function test<M extends IntegrationModule>(
  module: M,
  data: IntegrationConfigMap[M] & Partial<TestAliyunSmsInput>
): Promise<TestIntegrationResult> {
  return mutator<TestIntegrationResult>({
    url: `/admin/integrations/${module}/test`,
    method: 'POST',
    data,
  });
}

function remove(module: IntegrationModule): Promise<SaveIntegrationResult> {
  return mutator<SaveIntegrationResult>({
    url: `/admin/integrations/${module}`,
    method: 'DELETE',
  });
}

function uploadMailBrandLogo(file: Blob): Promise<{ url: string }> {
  const data = new FormData();
  data.append('file', file);
  return mutator<{ url: string }>({
    url: '/admin/integrations/mail/brand-logo',
    method: 'PUT',
    data,
  });
}

function removeMailBrandLogo(): Promise<{ url: null }> {
  return mutator<{ url: null }>({
    url: '/admin/integrations/mail/brand-logo',
    method: 'DELETE',
  });
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
