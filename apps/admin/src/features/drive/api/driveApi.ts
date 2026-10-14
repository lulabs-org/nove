import { mutator } from '../../../shared/lib/api/mutator';
import type { DriveNode, DriveNodePage, DriveSpace, UploadSession } from '../model/types';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  html: 'text/html',
  htm: 'text/html',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

function resolveContentType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return file.type || CONTENT_TYPES[extension] || 'application/octet-stream';
}

export const driveApi = {
  listSpaces: () => mutator<DriveSpace[]>({ url: '/drive/spaces', method: 'GET' }),

  listNodes: (spaceId: string, parentId?: string | null, cursor?: string) =>
    mutator<DriveNodePage>({
      url: `/drive/spaces/${spaceId}/nodes`,
      method: 'GET',
      params: { parentId: parentId ?? undefined, cursor, limit: 100 },
    }),

  createFolder: (spaceId: string, parentId: string | null, name: string) =>
    mutator<DriveNode>({
      url: '/drive/folders',
      method: 'POST',
      data: { spaceId, parentId, name },
    }),

  rename: (nodeId: string, name: string) =>
    mutator<DriveNode>({
      url: `/drive/nodes/${nodeId}`,
      method: 'PATCH',
      data: { name },
    }),

  move: (nodeId: string, parentId: string | null) =>
    mutator<DriveNode>({
      url: `/drive/nodes/${nodeId}/move`,
      method: 'POST',
      data: { parentId },
    }),

  getFile: (fileId: string) =>
    mutator<{
      id: string;
      version: {
        version: number;
        contentType: string;
        sizeBytes: string;
        checksumSha256: string | null;
        status: string;
      };
    }>({ url: `/drive/files/${fileId}`, method: 'GET' }),

  listBindings: (fileId: string) =>
    mutator<
      Array<{ id: string; targetType: string; targetId: string; purpose: string; active: boolean }>
    >({
      url: `/drive/files/${fileId}/bindings`,
      method: 'GET',
    }),

  listAudit: (nodeId: string) =>
    mutator<
      Array<{
        id: string;
        action: string;
        createdAt: string;
        actor: { username: string | null; email: string | null } | null;
      }>
    >({
      url: `/drive/nodes/${nodeId}/audit`,
      method: 'GET',
    }),

  listGrants: (nodeId: string) =>
    mutator<
      Array<{
        id: string;
        principalType: string;
        principalId: string;
        effect: string;
        actions: string[];
      }>
    >({
      url: `/drive/nodes/${nodeId}/grants`,
      method: 'GET',
    }),

  putGrant: (
    nodeId: string,
    data: { principalType: string; principalId: string; effect: string; actions: string[] }
  ) => mutator({ url: `/drive/nodes/${nodeId}/grants`, method: 'PUT', data }),

  deleteGrant: (nodeId: string, grantId: string) =>
    mutator<void>({ url: `/drive/nodes/${nodeId}/grants/${grantId}`, method: 'DELETE' }),

  trash: (nodeId: string) => mutator<void>({ url: `/drive/nodes/${nodeId}`, method: 'DELETE' }),

  restore: (nodeId: string) =>
    mutator<void>({ url: `/drive/nodes/${nodeId}/restore`, method: 'POST' }),

  listTrash: (spaceId: string) =>
    mutator<{ items: DriveNode[] }>({
      url: '/drive/trash',
      method: 'GET',
      params: { spaceId },
    }),

  purgeTrash: (nodeId: string) =>
    mutator<boolean>({
      url: `/drive/trash/${nodeId}/purge`,
      method: 'DELETE',
    }),

  createPreviewUrl: (fileId: string) =>
    mutator<{ url: string; expiresInSeconds: number }>({
      url: `/drive/files/${fileId}/preview-url`,
      method: 'POST',
    }),

  createDownloadUrl: (fileId: string) =>
    mutator<{ url: string; expiresInSeconds: number }>({
      url: `/drive/files/${fileId}/download-url`,
      method: 'POST',
    }),

  createUploadSession: (
    spaceId: string,
    parentId: string | null,
    file: File,
    checksumSha256?: string
  ) =>
    mutator<UploadSession>({
      url: '/drive/upload-sessions',
      method: 'POST',
      data: {
        spaceId,
        parentId,
        fileName: file.name,
        contentType: resolveContentType(file),
        sizeBytes: String(file.size),
        checksumSha256,
      },
    }),

  signParts: (sessionId: string, partNumbers: number[]) =>
    mutator<{ parts: Array<{ partNumber: number; url: string }> }>({
      url: `/drive/upload-sessions/${sessionId}/parts`,
      method: 'POST',
      data: { partNumbers },
    }),

  completeUpload: (sessionId: string, parts: Array<{ number: number; etag: string }>) =>
    mutator<DriveNode>({
      url: `/drive/upload-sessions/${sessionId}/complete`,
      method: 'POST',
      data: { parts },
    }),

  abortUpload: (sessionId: string) =>
    mutator<void>({ url: `/drive/upload-sessions/${sessionId}`, method: 'DELETE' }),
};
