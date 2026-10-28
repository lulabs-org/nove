import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  AccountSecurityControllerGetLoginActivitiesParams,
  AccountSecurityResponseDto,
  ChangeEmailDto,
  ChangePasswordDto,
  ChangePhoneDto,
  ContactChangeResponseDto,
  LoginActivitiesResponseDto,
  LoginActivityDto,
  SecurityCodeSentResponseDto,
  SecurityProofDto,
  SecuritySessionDto,
  SendEmailChangeCodeDto,
  SendIdentityCodeDto,
  SendPhoneChangeCodeDto,
  VerifyIdentityResponseDto,
} from '../../../../shared/lib/api/orval/business/schemas';

export interface RequestOptions {
  signal?: AbortSignal;
}

export type LoginActivitiesParams = AccountSecurityControllerGetLoginActivitiesParams;

export type {
  AccountSecurityResponseDto,
  ChangeEmailDto,
  ChangePasswordDto,
  ChangePhoneDto,
  ContactChangeResponseDto,
  LoginActivitiesResponseDto,
  LoginActivityDto,
  SecurityCodeSentResponseDto,
  SecurityProofDto,
  SecuritySessionDto,
  SendEmailChangeCodeDto,
  SendIdentityCodeDto,
  SendPhoneChangeCodeDto,
  VerifyIdentityResponseDto,
};

export const securityApi = {
  getSecurity(options?: RequestOptions): Promise<AccountSecurityResponseDto> {
    return mutator<AccountSecurityResponseDto>({
      url: '/api/user/security',
      method: 'GET',
      signal: options?.signal,
    });
  },

  listSessions(options?: RequestOptions): Promise<SecuritySessionDto[]> {
    return mutator<SecuritySessionDto[]>({
      url: '/api/user/security/sessions',
      method: 'GET',
      signal: options?.signal,
    });
  },

  getLoginActivities(
    params?: LoginActivitiesParams,
    options?: RequestOptions
  ): Promise<LoginActivitiesResponseDto> {
    return mutator<LoginActivitiesResponseDto>({
      url: '/api/user/security/login-activities',
      method: 'GET',
      params,
      signal: options?.signal,
    });
  },

  changePassword(data: ChangePasswordDto): Promise<void> {
    return mutator<void>({
      url: '/api/user/security/password',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  changeEmail(data: ChangeEmailDto): Promise<ContactChangeResponseDto> {
    return mutator<ContactChangeResponseDto>({
      url: '/api/user/security/email',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  changePhone(data: ChangePhoneDto): Promise<ContactChangeResponseDto> {
    return mutator<ContactChangeResponseDto>({
      url: '/api/user/security/phone',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  revokeSession(sessionId: string): Promise<void> {
    return mutator<void>({
      url: `/api/user/security/sessions/${sessionId}`,
      method: 'DELETE',
    });
  },

  revokeOtherSessions(): Promise<void> {
    return mutator<void>({
      url: '/api/user/security/sessions/others',
      method: 'DELETE',
    });
  },

  sendIdentityCode(data: SendIdentityCodeDto): Promise<SecurityCodeSentResponseDto> {
    return mutator<SecurityCodeSentResponseDto>({
      url: '/api/user/security/identity-code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  sendEmailCode(data: SendEmailChangeCodeDto): Promise<SecurityCodeSentResponseDto> {
    return mutator<SecurityCodeSentResponseDto>({
      url: '/api/user/security/email/code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  sendPhoneCode(data: SendPhoneChangeCodeDto): Promise<SecurityCodeSentResponseDto> {
    return mutator<SecurityCodeSentResponseDto>({
      url: '/api/user/security/phone/code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  verifyIdentity(data: SecurityProofDto): Promise<VerifyIdentityResponseDto> {
    return mutator<VerifyIdentityResponseDto>({
      url: '/api/user/security/verify-identity',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },
};
