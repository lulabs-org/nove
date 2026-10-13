import { generateNumericCode } from './index';

describe('generateNumericCode', () => {
  it('returns empty string for non-positive length', () => {
    expect(generateNumericCode(0)).toBe('');
    expect(generateNumericCode(-1 as unknown as number)).toBe('');
  });

  it('generates a 6-digit code by default', () => {
    const code = generateNumericCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('generates numeric code of specified length', () => {
    for (const len of [1, 2, 4, 8]) {
      const code = generateNumericCode(len);
      expect(code).toHaveLength(len === 1 ? 1 : len);
      expect(code).toMatch(new RegExp(`^\\d{${len}}$`));
    }
  });

  it('always produces digits only across multiple runs', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateNumericCode(6)).toMatch(/^\d{6}$/);
    }
  });
});
