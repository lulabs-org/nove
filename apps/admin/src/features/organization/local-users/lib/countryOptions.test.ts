import { describe, expect, it } from 'vitest';
import { COUNTRY_OPTIONS } from './countryOptions';

describe('country options', () => {
  it('puts common countries first and keeps values as display names', () => {
    expect(COUNTRY_OPTIONS[0]).toEqual({ label: '中国', value: '中国' });
    expect(COUNTRY_OPTIONS).toContainEqual({ label: '美国', value: '美国' });
    expect(new Set(COUNTRY_OPTIONS.map((option) => option.value)).size).toBe(
      COUNTRY_OPTIONS.length
    );
  });
});
