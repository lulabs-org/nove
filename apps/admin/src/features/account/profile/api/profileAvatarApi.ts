import type { UserProfileResponseDto } from '../../../../shared/lib/api/orval/business/schemas';
import { mutator } from '../../../../shared/lib/api/mutator';

export function uploadProfileAvatar(file: Blob): Promise<UserProfileResponseDto> {
  const data = new FormData();
  data.append('file', file);
  return mutator<UserProfileResponseDto>({
    url: '/api/user/profile/avatar',
    method: 'PUT',
    data,
  });
}

export function deleteProfileAvatar(): Promise<UserProfileResponseDto> {
  return mutator<UserProfileResponseDto>({
    url: '/api/user/profile/avatar',
    method: 'DELETE',
  });
}
