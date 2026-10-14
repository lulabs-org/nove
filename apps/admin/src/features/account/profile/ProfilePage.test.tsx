import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
  getMe: vi.fn(),
  setUser: vi.fn(),
  user: {
    id: 'user-1',
    email: 'yangshiming@proflu.cn',
    countryCode: '+86',
    phone: '18184502522',
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: '2026-08-25T15:17:44.000Z',
    createdAt: '2026-01-03T23:41:54.000Z',
    username: 'yangshiming',
    name: '杨仕明',
    roles: ['SUPER_ADMIN'],
    currentOrgId: 'organization-1',
    permissions: ['organization:read', 'organization:create'],
    active: true,
    profile: null,
  },
}));

vi.mock('../../../shared/lib/api/orval/business/user', () => ({
  userControllerGetProfile: mocks.getProfile,
  userControllerUpdateProfile: mocks.updateProfile,
}));

vi.mock('./api/profileAvatarApi', () => ({
  uploadProfileAvatar: mocks.uploadAvatar,
  deleteProfileAvatar: mocks.deleteAvatar,
}));

vi.mock('antd-img-crop', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../../auth/api/api', () => ({ getMe: mocks.getMe }));
vi.mock('../../auth/model/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: { user: typeof mocks.user }) => unknown) => selector({ user: mocks.user }),
    {
      getState: () => ({ setUser: mocks.setUser }),
    }
  ),
}));

describe('ProfilePage', () => {
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
    mocks.getProfile.mockResolvedValue({
      id: 'user-1',
      username: 'yangshiming',
      email: 'yangshiming@proflu.cn',
      countryCode: '+86',
      phone: '18184502522',
      emailVerified: true,
      phoneVerified: false,
      lastLoginAt: '2026-08-25T15:17:44.000Z',
      createdAt: '2026-01-03T23:41:54.000Z',
      profile: {
        name: '杨仕明',
        avatar: '',
        bio: 'Nove 系统管理员',
      },
    });
    mocks.getMe.mockResolvedValue(mocks.user);
  });

  it('focuses on editable profile and account safety without permission details', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    expect(await screen.findByRole('heading', { name: '杨仕明' })).toBeInTheDocument();
    expect(screen.getByText('个人资料')).toBeInTheDocument();
    expect(screen.getByText('账号与安全')).toBeInTheDocument();
    expect(screen.queryByLabelText('用户昵称')).not.toBeInTheDocument();
    expect(screen.getAllByText('@yangshiming')).toHaveLength(2);
    expect(screen.queryByLabelText('显示名称')).not.toBeInTheDocument();
    expect(screen.getByText('已启用')).toBeInTheDocument();

    expect(screen.queryByText('权限概览')).not.toBeInTheDocument();
    expect(screen.queryByText('SUPER_ADMIN')).not.toBeInTheDocument();
    expect(screen.queryByText('organization:read')).not.toBeInTheDocument();
    expect(screen.queryByText('organization-1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /编辑资料/ }));
    expect(await screen.findByLabelText('用户昵称')).toHaveValue('杨仕明');
    expect(screen.queryByLabelText('头像 URL')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /上传新头像/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('区号')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '前往安全设置修改' })).toHaveAttribute(
      'href',
      '/settings/security'
    );

    fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }));
    expect(screen.queryByLabelText('用户昵称')).not.toBeInTheDocument();
  });

  it('uploads a selected local avatar immediately and refreshes auth state', async () => {
    const updatedProfile = {
      id: 'user-1',
      username: 'yangshiming',
      email: 'yangshiming@proflu.cn',
      emailVerified: true,
      phoneVerified: false,
      createdAt: '2026-01-03T23:41:54.000Z',
      profile: {
        name: '杨仕明',
        avatar: 'https://cdn.example.com/avatars/user-1/new.webp',
      },
    };
    mocks.uploadAvatar.mockResolvedValue(updatedProfile);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    await screen.findByRole('heading', { name: '杨仕明' });
    fireEvent.click(screen.getByRole('button', { name: /编辑资料/ }));
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File([new Uint8Array([1, 2, 3])], 'avatar.png', {
      type: 'image/png',
    });
    fireEvent.change(fileInput!, { target: { files: [file] } });

    await waitFor(() => {
      expect(mocks.uploadAvatar.mock.calls[0]?.[0]).toBe(file);
    });
    await waitFor(() => {
      expect(mocks.getMe).toHaveBeenCalled();
      expect(mocks.setUser).toHaveBeenCalledWith(mocks.user);
      expect(container.querySelector('.profile-avatar img')).toHaveAttribute(
        'src',
        'https://cdn.example.com/avatars/user-1/new.webp'
      );
    });
  });

  it('saves text profile fields without the removed avatar property', async () => {
    const updatedProfile = await mocks.getProfile();
    mocks.updateProfile.mockResolvedValue(updatedProfile);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    await screen.findByRole('heading', { name: '杨仕明' });
    fireEvent.click(screen.getByRole('button', { name: /编辑资料/ }));
    fireEvent.change(await screen.findByLabelText('个人简介'), {
      target: { value: '新的个人简介' },
    });
    fireEvent.click(screen.getByRole('button', { name: /保存资料/ }));

    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalled());
    expect(mocks.updateProfile.mock.calls[0][0]).not.toHaveProperty('avatar');
    expect(mocks.updateProfile.mock.calls[0][0]).not.toHaveProperty('email');
    expect(mocks.updateProfile.mock.calls[0][0]).not.toHaveProperty('phone');
    expect(mocks.updateProfile.mock.calls[0][0]).not.toHaveProperty('countryCode');
  });
});
