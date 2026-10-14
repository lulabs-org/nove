import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityPage } from './SecurityPage';

const api = vi.hoisted(() => ({
  getSecurity: vi.fn(),
  listSessions: vi.fn(),
  getActivities: vi.fn(),
  sendIdentityCode: vi.fn(),
  sendEmailCode: vi.fn(),
  sendPhoneCode: vi.fn(),
  verifyIdentity: vi.fn(),
  changePassword: vi.fn(),
  changeEmail: vi.fn(),
  changePhone: vi.fn(),
  revokeSession: vi.fn(),
  revokeOthers: vi.fn(),
}));

const auth = vi.hoisted(() => ({ clearAuth: vi.fn() }));

vi.mock('../../../shared/lib/api/orval/business/account-security', () => ({
  accountSecurityControllerGetSecurity: api.getSecurity,
  accountSecurityControllerListSessions: api.listSessions,
  accountSecurityControllerGetLoginActivities: api.getActivities,
  accountSecurityControllerSendIdentityCode: api.sendIdentityCode,
  accountSecurityControllerSendEmailCode: api.sendEmailCode,
  accountSecurityControllerSendPhoneCode: api.sendPhoneCode,
  accountSecurityControllerVerifyIdentity: api.verifyIdentity,
  accountSecurityControllerChangePassword: api.changePassword,
  accountSecurityControllerChangeEmail: api.changeEmail,
  accountSecurityControllerChangePhone: api.changePhone,
  accountSecurityControllerRevokeSession: api.revokeSession,
  accountSecurityControllerRevokeOtherSessions: api.revokeOthers,
}));

vi.mock('../../auth/model/authStore', () => ({
  useAuthStore: (selector: (state: { clearAuth: () => void }) => unknown) =>
    selector({ clearAuth: auth.clearAuth }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <SecurityPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    api.getSecurity.mockResolvedValue({
      hasPassword: true,
      passwordSetAt: '2026-08-01T00:00:00.000Z',
      email: 'tester@example.com',
      emailVerified: true,
      countryCode: '+86',
      phone: '13800138000',
      phoneVerified: true,
      availableVerificationMethods: ['password', 'email_code', 'phone_code'],
    });
    api.listSessions.mockResolvedValue([
      {
        id: 'session-1',
        current: true,
        deviceInfo: 'Web · MacIntel',
        ip: '127.0.0.1',
        createdAt: '2026-08-31T00:00:00.000Z',
        lastActiveAt: '2026-08-31T00:00:00.000Z',
        expiresAt: '2026-09-07T00:00:00.000Z',
      },
    ]);
    api.getActivities.mockResolvedValue({
      items: [
        {
          id: 'log-1',
          loginType: 'EMAIL_PASSWORD',
          success: true,
          ip: '127.0.0.1',
          userAgent: 'Chrome',
          createdAt: '2026-08-31T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
    api.verifyIdentity.mockResolvedValue({ verified: true });
  });

  it('renders the functional security sections', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: '安全设置' })).toBeInTheDocument();
    expect(screen.getByText('账号安全')).toBeInTheDocument();
    expect(screen.getByText('登录设备')).toBeInTheDocument();
    expect(screen.getByText('最近 30 天登录记录')).toBeInTheDocument();
    expect(screen.getByText('Web · MacIntel')).toBeInTheDocument();
    expect(screen.getByText('邮箱密码')).toBeInTheDocument();
    expect(screen.getByText('t***r@example.com')).toBeInTheDocument();
    expect(screen.getByText('+86 138****8000')).toBeInTheDocument();
    expect(screen.queryByText('tester@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('+86 13800138000')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '查看邮箱' }));
    expect(screen.getByText('tester@example.com')).toBeInTheDocument();
    expect(screen.getByText('+86 138****8000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '查看手机号' }));
    expect(screen.getByText('+86 13800138000')).toBeInTheDocument();
  });

  it('uses a two-step password flow with identity verification first', async () => {
    renderPage();
    await screen.findByText('账号安全');

    fireEvent.click(screen.getByRole('button', { name: /修改密码/ }));
    expect((await screen.findAllByText('身份确认')).length).toBeGreaterThan(0);
    const currentPasswordInput = screen.getByLabelText('当前密码', {
      selector: 'input#currentPassword',
    });
    expect(currentPasswordInput).toBeInTheDocument();
    fireEvent.change(currentPasswordInput, {
      target: { value: 'OldPassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: '验证并继续' }));

    await waitFor(() =>
      expect(api.verifyIdentity).toHaveBeenCalledWith({
        verificationMethod: 'password',
        currentPassword: 'OldPassword1',
      })
    );
    await waitFor(() => expect(screen.getByLabelText('新密码')).toBeInTheDocument());
    expect(screen.getByLabelText('确认新密码')).toBeInTheDocument();
  });

  it('stays on identity confirmation when the server rejects the password', async () => {
    api.verifyIdentity.mockRejectedValueOnce(new Error('身份验证失败'));
    renderPage();
    await screen.findByText('账号安全');

    fireEvent.click(screen.getByRole('button', { name: /修改密码/ }));
    fireEvent.change(
      await screen.findByLabelText('当前密码', {
        selector: 'input#currentPassword',
      }),
      { target: { value: 'WrongPassword1' } }
    );
    fireEvent.click(screen.getByRole('button', { name: '验证并继续' }));

    await waitFor(() => expect(api.verifyIdentity).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('身份验证失败')).toBeInTheDocument();
    expect(screen.queryByLabelText('新密码')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('当前密码', { selector: 'input#currentPassword' })
    ).toBeInTheDocument();
  });

  it('shows an inline error when sending an identity code fails', async () => {
    api.getSecurity.mockResolvedValueOnce({
      hasPassword: false,
      email: 'tester@example.com',
      emailVerified: true,
      countryCode: '+86',
      phone: null,
      phoneVerified: false,
      availableVerificationMethods: ['email_code'],
    });
    api.sendIdentityCode.mockRejectedValueOnce(new Error('验证码服务暂时不可用'));
    renderPage();
    await screen.findByText('账号安全');

    fireEvent.click(screen.getAllByRole('button', { name: '换绑' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: '发送验证码' }));

    await waitFor(() => expect(api.sendIdentityCode).toHaveBeenCalledWith({ channel: 'email' }));
    expect((await screen.findAllByText('验证码发送失败，请稍后重试')).length).toBeGreaterThan(0);
  });

  it('handles the contact-change response and clears auth when no session is preserved', async () => {
    api.changeEmail.mockResolvedValue({
      security: {
        email: 'new@example.com',
      },
      revokedSessionsCount: 2,
      currentSessionPreserved: false,
    });
    renderPage();
    await screen.findByText('账号安全');

    fireEvent.click(screen.getAllByRole('button', { name: '换绑' })[0]);
    fireEvent.change(
      await screen.findByLabelText('当前密码', {
        selector: 'input#currentPassword',
      }),
      { target: { value: 'OldPassword1' } }
    );
    fireEvent.click(screen.getByRole('button', { name: '验证并继续' }));
    await waitFor(() => expect(api.verifyIdentity).toHaveBeenCalledTimes(1));

    fireEvent.change(await screen.findByLabelText('新邮箱'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('6 位验证码'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认提交' }));

    await waitFor(() =>
      expect(api.changeEmail).toHaveBeenCalledWith({
        verificationMethod: 'password',
        currentPassword: 'OldPassword1',
        email: 'new@example.com',
        newCode: '123456',
      })
    );
    await waitFor(() => expect(auth.clearAuth).toHaveBeenCalledTimes(1));
  });
});
