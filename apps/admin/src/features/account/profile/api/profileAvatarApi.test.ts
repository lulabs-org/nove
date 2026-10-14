import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteProfileAvatar, uploadProfileAvatar } from './profileAvatarApi';

const mutator = vi.hoisted(() => vi.fn());

vi.mock('../../../../shared/lib/api/mutator', () => ({ mutator }));

describe('profileAvatarApi', () => {
  beforeEach(() => mutator.mockReset());

  it('uploads the selected file as multipart form data', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    mutator.mockResolvedValue({ id: 'user-1' });

    await uploadProfileAvatar(file);

    expect(mutator).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/user/profile/avatar',
        method: 'PUT',
        data: expect.any(FormData),
      })
    );
    const formData = mutator.mock.calls[0][0].data as FormData;
    expect(formData.get('file')).toBe(file);
  });

  it('deletes the current avatar', async () => {
    mutator.mockResolvedValue({ id: 'user-1' });

    await deleteProfileAvatar();

    expect(mutator).toHaveBeenCalledWith({
      url: '/api/user/profile/avatar',
      method: 'DELETE',
    });
  });
});
