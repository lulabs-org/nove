import { describe, expect, it } from 'vitest';
import { buildLoginCodeRequest, buildLoginRequest, parseLoginIdentifier } from './loginIdentifier';

describe('login identifier helpers', () => {
  it('maps an email to email password and code requests', () => {
    const identifier = parseLoginIdentifier(' user@example.com ');

    expect(identifier).toEqual({ kind: 'email', value: 'user@example.com' });
    expect(buildLoginRequest(identifier!, 'password', 'Password1')).toEqual({
      type: 'email_password',
      email: 'user@example.com',
      password: 'Password1',
      clientType: 'web',
    });
    expect(buildLoginCodeRequest(identifier!)).toEqual({
      target: 'user@example.com',
      type: 'login',
    });
  });

  it.each(['18184509447', '+86 181 8450 9447', '0086-181-8450-9447'])(
    'normalizes a mainland phone number: %s',
    (value) => {
      const identifier = parseLoginIdentifier(value);

      expect(identifier).toEqual({
        kind: 'phone',
        value: '18184509447',
        countryCode: '+86',
      });
      expect(buildLoginRequest(identifier!, 'code', '123456')).toEqual({
        type: 'phone_code',
        phone: '18184509447',
        countryCode: '+86',
        code: '123456',
        clientType: 'web',
      });
      expect(buildLoginCodeRequest(identifier!)).toEqual({
        target: '18184509447',
        type: 'login',
        countryCode: '+86',
      });
    }
  );

  it.each(['', 'not-an-account', '12345', 'user@invalid'])(
    'rejects an invalid identifier: %s',
    (value) => {
      expect(parseLoginIdentifier(value)).toBeNull();
    }
  );
});
