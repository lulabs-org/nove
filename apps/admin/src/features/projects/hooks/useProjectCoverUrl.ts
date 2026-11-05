import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { driveApi } from '../../drive/api/driveApi';
import { getDriveFileId } from '../../drive/lib/driveFileReference';
import { DRIVE_PREVIEW_URL_QUERY_KEY, pickInlinePreviewUrl } from '../../drive/lib/drivePreview';

export function useProjectCoverUrl(reference?: string | null): string | undefined {
  const { checkPermission } = useAuth();
  const fileId = getDriveFileId(reference);
  const canReadDrive = checkPermission(PERMISSIONS.DRIVE.READ);
  const query = useQuery({
    queryKey: [DRIVE_PREVIEW_URL_QUERY_KEY, fileId],
    enabled: Boolean(fileId) && canReadDrive,
    staleTime: 8 * 60 * 1000,
    queryFn: () => driveApi.createPreviewUrl(fileId!),
  });
  // 封面同样只能吃 inline 地址；attachment 会被浏览器当下载，渲染不出图
  return fileId ? (pickInlinePreviewUrl(query.data) ?? undefined) : reference || undefined;
}
