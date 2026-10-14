import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveMediaPicker } from './DriveMediaPicker';

const mocks = vi.hoisted(() => ({
  listSpaces: vi.fn(),
  listNodes: vi.fn(),
  createPreviewUrl: vi.fn(),
  createFolder: vi.fn(),
  createUploadSession: vi.fn(),
  signParts: vi.fn(),
  completeUpload: vi.fn(),
  abortUpload: vi.fn(),
}));

vi.mock('../api/driveApi', () => ({
  driveApi: {
    ...mocks,
  },
}));

function renderPicker(onChange = vi.fn(), mediaType: 'image' | 'video' | 'document' = 'image') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <DriveMediaPicker
        orgId="org-1"
        onChange={onChange}
        mediaType={mediaType}
        label={mediaType === 'image' ? '产品图片' : mediaType === 'video' ? '产品视频' : '身份凭证'}
        entityLabel={mediaType === 'document' ? '身份凭证' : '产品'}
      />
    </QueryClientProvider>
  );
  return onChange;
}

describe('Product media picker', () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listSpaces.mockResolvedValue([
      { id: 'space-1', name: '组织云盘', type: 'ORG', orgId: 'org-1' },
    ]);
    mocks.listNodes.mockResolvedValue({
      items: [
        {
          id: 'node-1',
          spaceId: 'space-1',
          parentId: null,
          type: 'FILE',
          name: 'cover.png',
          inheritAcl: true,
          fileId: 'file-1',
          contentType: 'image/png',
          sizeBytes: '1024',
          fileStatus: 'ACTIVE',
          createdAt: '2026-09-12T00:00:00.000Z',
          updatedAt: '2026-09-12T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
  });

  it('stores a cloud drive reference after selecting an image', async () => {
    const onChange = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: /从云盘选择/ }));
    expect(await screen.findByText('cover.png')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '选择' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('drive://file/file-1'));
  });
  it('filters videos separately from images and folders', async () => {
    mocks.listNodes.mockResolvedValue({
      items: [
        {
          id: 'video-node',
          type: 'FILE',
          fileId: 'video-file',
          name: 'demo.mp4',
          contentType: 'video/mp4',
          fileStatus: 'ACTIVE',
        },
        {
          id: 'image-node',
          type: 'FILE',
          fileId: 'image-file',
          name: 'cover.png',
          contentType: 'image/png',
          fileStatus: 'ACTIVE',
        },
      ],
    });
    const onChange = renderPicker(vi.fn(), 'video');
    fireEvent.click(screen.getByRole('button', { name: /从云盘选择/ }));
    expect(await screen.findByText('demo.mp4')).toBeInTheDocument();
    expect(screen.queryByText('cover.png')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '选择' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('drive://file/video-file'));
  });
  it('allows image and PDF evidence files for identity documents', async () => {
    mocks.listNodes.mockResolvedValue({
      items: [
        {
          id: 'image-node',
          type: 'FILE',
          fileId: 'image-file',
          name: 'front.png',
          contentType: 'image/png',
        },
        {
          id: 'pdf-node',
          type: 'FILE',
          fileId: 'pdf-file',
          name: 'passport.pdf',
          contentType: 'application/pdf',
        },
        {
          id: 'video-node',
          type: 'FILE',
          fileId: 'video-file',
          name: 'clip.mp4',
          contentType: 'video/mp4',
        },
      ],
      nextCursor: null,
    });
    renderPicker(vi.fn(), 'document');
    fireEvent.click(screen.getByRole('button', { name: /从云盘选择/ }));
    expect(await screen.findByText('front.png')).toBeInTheDocument();
    expect(screen.getByText('passport.pdf')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
  });
  it.each(['image', 'video'] as const)(
    'uploads %s into the matching product folder',
    async (mediaType) => {
      mocks.listNodes.mockResolvedValue({ items: [], nextCursor: null });
      mocks.createFolder.mockResolvedValue({ id: 'folder-1' });
      mocks.createUploadSession.mockResolvedValue({
        id: 'session-1',
        recommendedPartSizeBytes: 16,
      });
      mocks.signParts.mockResolvedValue({
        parts: [{ partNumber: 1, url: 'https://upload.test/part' }],
      });
      mocks.completeUpload.mockResolvedValue({ fileId: 'uploaded', fileStatus: 'ACTIVE' });
      vi.stubGlobal('crypto', {
        subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) },
      });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ etag: 'part-etag' }) })
      );
      const onChange = renderPicker(vi.fn(), mediaType);
      fireEvent.click(screen.getByRole('button', { name: /上传到云盘/ }));
      await screen.findByText('当前目录没有' + (mediaType === 'image' ? '图片' : '视频'));
      const file = new File(['abc'], mediaType === 'image' ? 'cover.png' : 'demo.mp4', {
        type: mediaType === 'image' ? 'image/png' : 'video/mp4',
      });
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => new Uint8Array([1, 2, 3]).buffer,
      });
      fireEvent.change(document.querySelector('input[type="file"]')!, {
        target: { files: [file] },
      });
      await waitFor(() => expect(onChange).toHaveBeenCalledWith('drive://file/uploaded'));
      expect(mocks.createFolder).toHaveBeenCalledWith(
        'space-1',
        null,
        mediaType === 'image' ? '产品图片' : '产品视频'
      );
      expect(mocks.createUploadSession).toHaveBeenCalledWith(
        'space-1',
        'folder-1',
        file,
        expect.any(String)
      );
      expect(mocks.completeUpload).toHaveBeenCalledWith('session-1', [
        { number: 1, etag: 'part-etag' },
      ]);
    }
  );
});
