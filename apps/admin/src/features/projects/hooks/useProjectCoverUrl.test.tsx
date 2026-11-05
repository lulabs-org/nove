import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useProjectCoverUrl } from './useProjectCoverUrl';

const COVER_INLINE = { url: 'https://storage.test/cover', expiresInSeconds: 600 };

const mocks = vi.hoisted(() => ({
  canReadDrive: true,
  createPreviewUrl: vi.fn(),
  createDownloadUrl: vi.fn(),
}));
vi.mock('../../drive/api/driveApi', () => ({ driveApi: mocks }));
vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ checkPermission: () => mocks.canReadDrive }),
}));

beforeEach(() => {
  mocks.canReadDrive = true;
  mocks.createPreviewUrl.mockClear();
  // preview-url 固定返回 inline（与后端 DriveService.createFileUrl 一致）
  mocks.createPreviewUrl.mockResolvedValue({ ...COVER_INLINE, contentDisposition: 'inline' });
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

it('refuses an attachment url so a cover never becomes a download', async () => {
  mocks.createPreviewUrl.mockResolvedValue({ ...COVER_INLINE, contentDisposition: 'attachment' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const { result, unmount } = renderHook(() => useProjectCoverUrl('drive://file/file-1'), {
    wrapper,
  });

  await waitFor(() => expect(mocks.createPreviewUrl).toHaveBeenCalled());
  expect(result.current).toBeUndefined();
  unmount();
  client.clear();
});
