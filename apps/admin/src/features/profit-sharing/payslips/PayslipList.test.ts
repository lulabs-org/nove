import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { resolvePayslipMonth } from './payslipListUtils';

describe('resolvePayslipMonth', () => {
  const fallback = dayjs('2026-10-08');

  it('uses the historical month supplied by the dashboard URL', () => {
    expect(resolvePayslipMonth('2026-05', fallback).format('YYYY-MM')).toBe('2026-05');
  });

  it.each([null, '2026-13', 'not-a-month'])('falls back for invalid month %s', (month) => {
    expect(resolvePayslipMonth(month, fallback).format('YYYY-MM')).toBe('2026-10');
  });
});
