import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../../../shared/lib/api/http', () => ({
  http: mocks,
}));

import { integrationsApi } from './integrationsApi';

describe('integrationsApi mail brand logo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploads a local file as multipart form data', async () => {
    mocks.put.mockResolvedValue({
      data: { url: 'https://cdn.example.com/logo.webp' },
    });
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    await expect(integrationsApi.uploadMailBrandLogo(file)).resolves.toEqual({
      url: 'https://cdn.example.com/logo.webp',
    });
    expect(mocks.put).toHaveBeenCalledWith(
      '/admin/integrations/mail/brand-logo',
      expect.any(FormData)
    );
    const data = mocks.put.mock.calls[0]?.[1] as FormData;
    expect(data.get('file')).toBe(file);
  });

  it('removes the active logo', async () => {
    mocks.delete.mockResolvedValue({ data: { url: null } });

    await expect(integrationsApi.removeMailBrandLogo()).resolves.toEqual({
      url: null,
    });
    expect(mocks.delete).toHaveBeenCalledWith('/admin/integrations/mail/brand-logo');
  });
});
