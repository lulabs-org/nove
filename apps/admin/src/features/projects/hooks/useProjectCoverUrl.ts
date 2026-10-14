import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { driveApi } from '../../drive/api/driveApi';
import { getDriveFileId } from '../../drive/lib/driveFileReference';

export function useProjectCoverUrl(reference?: string | null): string | undefined {
  const { checkPermission } = useAuth();
  const fileId = getDriveFileId(reference);
  const canReadDrive = checkPermission(PERMISSIONS.DRIVE.READ);
  const query = useQuery({
    queryKey: ['drive-image-preview-url', fileId],
    enabled: Boolean(fileId) && canReadDrive,
    staleTime: 8 * 60 * 1000,
    queryFn: () => driveApi.createPreviewUrl(fileId!),
  });
  return fileId ? query.data?.url : reference || undefined;
}
