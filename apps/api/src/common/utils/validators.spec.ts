import { isStrongPassword, isValidCnPhone, isValidEmail } from './index';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('accepts common valid emails', () => {
      const valid = [
        'test@example.com',
        'first.last@domain.co',
        'user+tag@sub.domain.io',
      ];
      for (const v of valid) {
        expect(isValidEmail(v)).toBe(true);
      }
    });

    it('rejects invalid emails', () => {
      const invalid = [
        '',
        'no-at-sign.com',
        'missing-domain@',
        '@missing-local.com',
        'with space@domain.com',
      ];
      for (const v of invalid) {
        expect(isValidEmail(v)).toBe(false);
      }
    });
  });

  describe('isValidCnPhone', () => {
    it('accepts 11-digit numbers not starting with 0', () => {
      const valid = ['19912345678', '12345678901', '98765432109'];
      for (const v of valid) {
        expect(isValidCnPhone(v)).toBe(true);
      }
    });

    it('rejects invalid numbers', () => {
      const invalid = [
        '01234567890', // starts with 0
        '1991234567', // too short
        '199123456789', // too long
        '1991234567a', // non-digit
      ];
      for (const v of invalid) {
        expect(isValidCnPhone(v)).toBe(false);
      }
    });
  });

  describe('isStrongPassword', () => {
    it('requires upper, lower, and digit', () => {
      expect(isStrongPassword('Abc123')).toBe(true);
      expect(isStrongPassword('aB9')).toBe(true);
    });

    it('rejects when one category missing', () => {
      expect(isStrongPassword('abcdef')).toBe(false); // no upper, no digit
      expect(isStrongPassword('ABCDEF')).toBe(false); // no lower, no digit
      expect(isStrongPassword('123456')).toBe(false); // no letters
      expect(isStrongPassword('abcDEF')).toBe(false); // no digit
    });
  });
});
