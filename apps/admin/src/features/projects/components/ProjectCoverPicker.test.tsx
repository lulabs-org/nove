import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectCoverPicker } from './ProjectCoverPicker';

const mocks = vi.hoisted(() => ({
  listSpaces: vi.fn(),
  listNodes: vi.fn(),
  createPreviewUrl: vi.fn(),
}));

vi.mock('../../drive/api/driveApi', () => ({
  driveApi: {
    ...mocks,
    createUploadSession: vi.fn(),
    signParts: vi.fn(),
    completeUpload: vi.fn(),
    abortUpload: vi.fn(),
  },
}));

function renderPicker(onChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProjectCoverPicker orgId="org-1" onChange={onChange} />
    </QueryClientProvider>
  );
  return onChange;
}

describe('ProjectCoverPicker', () => {
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
});
