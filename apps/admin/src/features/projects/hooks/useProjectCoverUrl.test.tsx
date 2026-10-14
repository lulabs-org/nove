import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useProjectCoverUrl } from './useProjectCoverUrl';

const mocks = vi.hoisted(() => ({
  canReadDrive: true,
  createPreviewUrl: vi
    .fn()
    .mockResolvedValue({ url: 'https://storage.test/cover', expiresInSeconds: 600 }),
  createDownloadUrl: vi.fn(),
}));
vi.mock('../../drive/api/driveApi', () => ({ driveApi: mocks }));
vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ checkPermission: () => mocks.canReadDrive }),
}));

beforeEach(() => {
  mocks.canReadDrive = true;
  mocks.createPreviewUrl.mockClear();
});

it('renders a drive cover through preview without requesting a download', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(() => useProjectCoverUrl('drive://file/file-1'), {
    wrapper,
  });
  await waitFor(() => expect(result.current).toBe('https://storage.test/cover'));
  expect(mocks.createPreviewUrl).toHaveBeenCalledWith('file-1');
  expect(mocks.createDownloadUrl).not.toHaveBeenCalled();
  unmount();
  client.clear();
});

it('does not request a drive preview without drive read permission', () => {
  mocks.canReadDrive = false;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const { result, unmount } = renderHook(() => useProjectCoverUrl('drive://file/file-1'), {
    wrapper,
  });

  expect(result.current).toBeUndefined();
  expect(mocks.createPreviewUrl).not.toHaveBeenCalled();
  unmount();
  client.clear();
});
