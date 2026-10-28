import { beforeEach, describe, expect, it, vi } from 'vitest';
import { organizationProfileApi } from './organizationProfileApi';

const apiMocks = vi.hoisted(() => ({
  mutator: vi.fn(),
}));

vi.mock('../../../../shared/lib/api/mutator', () => ({
  mutator: apiMocks.mutator,
}));

describe('organizationProfileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches organization profile with GET method and signal', async () => {
    const controller = new AbortController();
    const mockOrg = { id: 'org-1', name: 'Nove Team', active: true };
    apiMocks.mutator.mockResolvedValueOnce(mockOrg);

    const result = await organizationProfileApi.getProfile('org-1', controller.signal);
    expect(result).toBe(mockOrg);
    expect(apiMocks.mutator).toHaveBeenCalledWith({
      url: '/admin/orgs/org-1',
      method: 'GET',
      signal: controller.signal,
    });
  });

  it('saves profile with FormData containing text values, file, and logo action', async () => {
    const mockUpdated = { id: 'org-1', name: 'Updated Org', active: true };
    apiMocks.mutator.mockResolvedValueOnce(mockUpdated);

    const file = new File(['image-content'], 'logo.png', { type: 'image/png' });
    const result = await organizationProfileApi.saveProfile(
      'org-1',
      { name: 'Updated Org', description: 'New description', active: true },
      file,
      false
    );

    expect(result).toBe(mockUpdated);
    expect(apiMocks.mutator).toHaveBeenCalledTimes(1);

    const callArg = apiMocks.mutator.mock.calls[0][0];
    expect(callArg.url).toBe('/admin/orgs/org-1/profile');
    expect(callArg.method).toBe('PUT');

    const formData = callArg.data as FormData;
    expect(formData.get('name')).toBe('Updated Org');
    expect(formData.get('description')).toBe('New description');
    expect(formData.get('active')).toBe('true');
    expect(formData.get('logoAction')).toBe('keep');
    expect(formData.get('file')).toBe(file);
  });

  it('sets logoAction to remove when removeLogo is true', async () => {
    apiMocks.mutator.mockResolvedValueOnce({ id: 'org-1' });

    await organizationProfileApi.saveProfile('org-1', { name: 'Acme' }, undefined, true);

    const callArg = apiMocks.mutator.mock.calls[0][0];
    const formData = callArg.data as FormData;
    expect(formData.get('logoAction')).toBe('remove');
    expect(formData.get('file')).toBeNull();
  });

  it('generates consistent query key', () => {
    expect(organizationProfileApi.getQueryKey('org-123')).toEqual([
      'organization-profile',
      'org-123',
    ]);
  });
});
