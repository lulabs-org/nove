import type { LoginRequest } from './types';

export type LoginMode = 'password' | 'code';

export type ParsedLoginIdentifier =
  | { kind: 'email'; value: string }
  | { kind: 'phone'; value: string; countryCode: '+86' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CN_PHONE_PATTERN = /^[1-9]\d{10}$/;

export function parseLoginIdentifier(rawValue: string): ParsedLoginIdentifier | null {
  const value = rawValue.trim();
  if (EMAIL_PATTERN.test(value)) {
    return { kind: 'email', value };
  }

  const compactPhone = value.replace(/[\s-]/g, '');
  const phone = compactPhone.replace(/^(?:\+86|0086)/, '');
  if (CN_PHONE_PATTERN.test(phone)) {
    return { kind: 'phone', value: phone, countryCode: '+86' };
  }

  return null;
}

export function buildLoginRequest(
  identifier: ParsedLoginIdentifier,
  mode: LoginMode,
  credential: string
): LoginRequest {
  const identity =
    identifier.kind === 'email'
      ? { email: identifier.value }
      : { phone: identifier.value, countryCode: identifier.countryCode };

  return {
    type: `${identifier.kind}_${mode}`,
    ...identity,
    ...(mode === 'password' ? { password: credential } : { code: credential }),
    clientType: 'web',
  };
}

export function buildLoginCodeRequest(identifier: ParsedLoginIdentifier) {
  return {
    target: identifier.value,
    type: 'login' as const,
    ...(identifier.kind === 'phone' ? { countryCode: identifier.countryCode } : {}),
  };
}
