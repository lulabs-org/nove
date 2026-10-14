const DRIVE_FILE_PREFIX = 'drive://file/';

export function toDriveFileReference(fileId: string): string {
  return `${DRIVE_FILE_PREFIX}${fileId}`;
}

export function getDriveFileId(reference?: string | null): string | null {
  if (!reference?.startsWith(DRIVE_FILE_PREFIX)) return null;
  const fileId = reference.slice(DRIVE_FILE_PREFIX.length).trim();
  return fileId || null;
}
