import { beforeEach, describe, expect, it, vi } from 'vitest';
import { securityApi } from './securityApi';

const apiMocks = vi.hoisted(() => ({
  mutator: vi.fn(),
}));

vi.mock('../../../../shared/lib/api/mutator', () => ({
  mutator: apiMocks.mutator,
}));

describe('securityApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates query methods with url, method and optional abort signal', async () => {
    const controller = new AbortController();
    const securityData = { hasPassword: true, email: 'user@example.com' };
    const sessionsData = [{ id: 's1', isCurrent: true }];
    const activitiesData = { data: [], total: 0, page: 1, pageSize: 10 };

    apiMocks.mutator.mockResolvedValueOnce(securityData);
    await expect(securityApi.getSecurity({ signal: controller.signal })).resolves.toBe(securityData);
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security',
      method: 'GET',
      signal: controller.signal,
    });

    apiMocks.mutator.mockResolvedValueOnce(sessionsData);
    await expect(securityApi.listSessions({ signal: controller.signal })).resolves.toBe(sessionsData);
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/sessions',
      method: 'GET',
      signal: controller.signal,
    });

    apiMocks.mutator.mockResolvedValueOnce(activitiesData);
    await expect(
      securityApi.getLoginActivities({ page: 2, pageSize: 20 }, { signal: controller.signal })
    ).resolves.toBe(activitiesData);
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/login-activities',
      method: 'GET',
      params: { page: 2, pageSize: 20 },
      signal: controller.signal,
    });
  });

  it('delegates sensitive contact and password mutations with JSON headers', async () => {
    apiMocks.mutator.mockResolvedValue(undefined);

    await securityApi.changePassword({
      verificationMethod: 'password',
      currentPassword: 'oldPassword123',
      newPassword: 'secretPassword123',
    });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/password',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: {
        verificationMethod: 'password',
        currentPassword: 'oldPassword123',
        newPassword: 'secretPassword123',
      },
    });

    await securityApi.changeEmail({
      verificationMethod: 'email_code',
      identityCode: '111111',
      email: 'new@example.com',
      newCode: '123456',
    });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/email',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: {
        verificationMethod: 'email_code',
        identityCode: '111111',
        email: 'new@example.com',
        newCode: '123456',
      },
    });

    await securityApi.changePhone({
      verificationMethod: 'phone_code',
      identityCode: '222222',
      countryCode: '+86',
      phone: '13800000000',
      newCode: '654321',
    });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/phone',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: {
        verificationMethod: 'phone_code',
        identityCode: '222222',
        countryCode: '+86',
        phone: '13800000000',
        newCode: '654321',
      },
    });
  });

  it('delegates session revocation endpoints', async () => {
    apiMocks.mutator.mockResolvedValue(undefined);

    await securityApi.revokeSession('session-123');
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/sessions/session-123',
      method: 'DELETE',
    });

    await securityApi.revokeOtherSessions();
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/sessions/others',
      method: 'DELETE',
    });
  });

  it('delegates verification and verification code dispatching endpoints', async () => {
    apiMocks.mutator.mockResolvedValueOnce({ channel: 'email', maskedTarget: 'u***@test.com' });
    await securityApi.sendIdentityCode({ channel: 'email' });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/identity-code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { channel: 'email' },
    });

    apiMocks.mutator.mockResolvedValueOnce({ channel: 'email', maskedTarget: 'n***@test.com' });
    await securityApi.sendEmailCode({ email: 'new@example.com' });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/email/code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { email: 'new@example.com' },
    });

    apiMocks.mutator.mockResolvedValueOnce({ channel: 'sms', maskedTarget: '138****0000' });
    await securityApi.sendPhoneCode({ countryCode: '+86', phone: '13800000000' });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/phone/code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { countryCode: '+86', phone: '13800000000' },
    });

    apiMocks.mutator.mockResolvedValueOnce({ token: 'verified-ticket' });
    await securityApi.verifyIdentity({ verificationMethod: 'email_code', identityCode: '123456' });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/api/user/security/verify-identity',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { verificationMethod: 'email_code', identityCode: '123456' },
    });
  });
});
