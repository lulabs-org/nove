import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveDetailModal } from './DriveDetailModal';
import type { DriveNode, DriveSpace } from '../model/types';

const mocks = vi.hoisted(() => ({
  listAudit: vi.fn(),
  getFile: vi.fn(),
  listBindings: vi.fn(),
}));

vi.mock('../api/driveApi', () => ({
  driveApi: {
    listAudit: mocks.listAudit,
    getFile: mocks.getFile,
    listBindings: mocks.listBindings,
  },
}));

describe('DriveDetailModal', () => {
  const mockFolderNode: DriveNode = {
    id: 'node-folder-1',
    spaceId: 'space-1',
    parentId: null,
    type: 'FOLDER',
    name: 'test-folder',
    inheritAcl: true,
    fileId: null,
    contentType: null,
    sizeBytes: null,
    fileStatus: null,
    createdAt: '2026-09-09T00:48:08Z',
    updatedAt: '2026-09-09T00:48:08Z',
  };

  const mockFileNode: DriveNode = {
    id: 'node-file-1',
    spaceId: 'space-1',
    parentId: 'node-folder-1',
    type: 'FILE',
    name: 'meeting-record.m4a',
    inheritAcl: false,
    fileId: 'file-record-1',
    contentType: 'audio/mp4',
    sizeBytes: '10485760',
    fileStatus: 'ACTIVE',
    createdAt: '2026-09-09T01:00:00Z',
    updatedAt: '2026-09-09T01:05:00Z',
  };

  const mockSpace: DriveSpace = {
    id: 'space-1',
    name: '研发团队公共空间',
    type: 'ORG',
    orgId: 'org-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders folder details and basic attributes properly', async () => {
    mocks.listAudit.mockResolvedValue([
      {
        id: 'audit-1',
        action: 'CREATE_FOLDER',
        createdAt: '2026-09-09T00:48:08Z',
        actor: { username: 'test_user', email: 'test@example.com' },
      },
    ]);

    render(
      <DriveDetailModal
        node={mockFolderNode}
        space={mockSpace}
        path={[]}
        open={true}
        onClose={vi.fn()}
      />
    );

    // Title and type
    expect(screen.getByRole('heading', { name: 'test-folder' })).toBeInTheDocument();
    expect(screen.getAllByText('研发团队公共空间').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('node-folder-1')).toBeInTheDocument();
    expect(screen.getByText('继承空间权限')).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.listAudit).toHaveBeenCalledWith('node-folder-1');
    });
  });

  it('renders file details including version, size, SHA-256 and action buttons', async () => {
    mocks.listAudit.mockResolvedValue([]);
    mocks.getFile.mockResolvedValue({
      id: 'file-record-1',
      version: {
        id: 'ver-1',
        version: 1,
        contentType: 'audio/mp4',
        sizeBytes: '10485760',
        checksumSha256: 'abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890',
        status: 'ACTIVE',
      },
    });
    mocks.listBindings.mockResolvedValue([
      {
        id: 'binding-1',
        targetType: 'MINUTE',
        targetId: 'minute-999',
        purpose: 'RECORDING',
        active: true,
      },
    ]);

    const handleDownload = vi.fn();
    const handlePermissions = vi.fn();

    render(
      <DriveDetailModal
        node={mockFileNode}
        space={mockSpace}
        path={[mockFolderNode]}
        open={true}
        onClose={vi.fn()}
        onDownload={handleDownload}
        onOpenPermissions={handlePermissions}
      />
    );

    expect(screen.getByRole('heading', { name: 'meeting-record.m4a' })).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.getFile).toHaveBeenCalledWith('file-record-1');
      expect(mocks.listBindings).toHaveBeenCalledWith('file-record-1');
    });

    // Verify SHA-256 is displayed
    expect(
      screen.getByText('abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890')
    ).toBeInTheDocument();

    // Verify download button is rendered and clickable
    const downloadBtn = screen.getByRole('button', { name: /下载文件/i });
    expect(downloadBtn).toBeInTheDocument();
    fireEvent.click(downloadBtn);
    expect(handleDownload).toHaveBeenCalledWith(mockFileNode);

    // Verify permissions button
    const permBtn = screen.getByRole('button', { name: /管理权限/i });
    expect(permBtn).toBeInTheDocument();
    fireEvent.click(permBtn);
    expect(handlePermissions).toHaveBeenCalledWith(mockFileNode);
  });

  it('switches tabs to display business bindings and audit timeline', async () => {
    const user = userEvent.setup();

    mocks.listAudit.mockResolvedValue([
      {
        id: 'audit-1',
        action: 'CREATE_FOLDER',
        createdAt: '2026-09-09T00:48:08Z',
        actor: { username: 'creator_admin', email: 'admin@nove.ai' },
      },
    ]);
    mocks.getFile.mockResolvedValue({
      id: 'file-record-1',
      version: {
        version: 1,
        contentType: 'audio/mp4',
        sizeBytes: '10485760',
        checksumSha256: null,
        status: 'ACTIVE',
      },
    });
    mocks.listBindings.mockResolvedValue([
      {
        id: 'bind-1',
        targetType: 'MINUTE',
        targetId: 'minute-8888',
        purpose: 'RECORDING',
        active: true,
      },
    ]);

    render(
      <DriveDetailModal node={mockFileNode} space={mockSpace} open={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(mocks.listBindings).toHaveBeenCalled();
    });

    // Switch to Bindings tab
    const bindingsTab = screen.getByRole('tab', { name: /业务关联/i });
    await user.click(bindingsTab);
    expect(screen.getByText('会议纪要')).toBeInTheDocument();
    expect(screen.getByText('会议原声录音')).toBeInTheDocument();
    expect(screen.getByText('minute-8888')).toBeInTheDocument();

    // Switch to Audit tab
    const auditTab = screen.getByRole('tab', { name: /审计记录/i });
    await user.click(auditTab);
    expect(screen.getByText('创建文件夹')).toBeInTheDocument();
    expect(screen.getByText('creator_admin')).toBeInTheDocument();
  });
});
