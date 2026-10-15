import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mutator: vi.fn(),
}));

vi.mock('../../../../shared/lib/api/mutator', () => ({
  mutator: mocks.mutator,
}));

import { integrationsApi } from './integrationsApi';

describe('integrationsApi mail brand logo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploads a local file as multipart form data', async () => {
    mocks.mutator.mockResolvedValue({ url: 'https://cdn.example.com/logo.webp' });
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    await expect(integrationsApi.uploadMailBrandLogo(file)).resolves.toEqual({
      url: 'https://cdn.example.com/logo.webp',
    });
    expect(mocks.mutator).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/integrations/mail/brand-logo',
        method: 'PUT',
        data: expect.any(FormData),
      })
    );
    const callConfig = mocks.mutator.mock.calls[0]?.[0];
    const data = callConfig.data as FormData;
    expect(data.get('file')).toBe(file);
  });

  it('removes the active logo', async () => {
    mocks.mutator.mockResolvedValue({ url: null });

    await expect(integrationsApi.removeMailBrandLogo()).resolves.toEqual({
      url: null,
    });
    expect(mocks.mutator).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/integrations/mail/brand-logo',
        method: 'DELETE',
      })
    );
  });
});
