import { beforeEach, describe, expect, it, vi } from 'vitest';
import { skillApi } from './skillApi';
import { mutator } from '../../../shared/lib/api/mutator';

vi.mock('../../../shared/lib/api/mutator', () => ({ mutator: vi.fn() }));

describe('skillApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploads the original Zip with explicit version and changelog', async () => {
    const file = new File(['PK\x03\x04'], 'demo.zip', { type: 'application/zip' });
    await skillApi.upload(file, '1.0.0', 'First release');
    const request = vi.mocked(mutator).mock.calls[0][0];
    expect(request.url).toBe('/api/v1/skills/import-zip');
    expect(request.method).toBe('POST');
    expect(request.data).toBeInstanceOf(FormData);
    expect((request.data as FormData).get('file')).toBe(file);
    expect((request.data as FormData).get('version')).toBe('1.0.0');
    expect((request.data as FormData).get('changelog')).toBe('First release');
  });

  it('targets the selected skill for a new version without activating it', async () => {
    const file = new File(['zip'], 'demo.zip');
    await skillApi.upload(file, '2.0.0', undefined, 'skill/id');
    expect(vi.mocked(mutator).mock.calls[0][0].url).toBe('/api/v1/skills/skill%2Fid/versions');
    expect(vi.mocked(mutator).mock.calls[0][0].data).toBeInstanceOf(FormData);
  });

  it('requests the original Zip as a Blob', async () => {
    await skillApi.download('skill/id', '1.0+beta');
    expect(vi.mocked(mutator).mock.calls[0][0]).toMatchObject({
      url: '/api/v1/skills/skill%2Fid/versions/1.0%2Bbeta/download',
      method: 'GET',
      responseType: 'blob',
    });
  });
});
