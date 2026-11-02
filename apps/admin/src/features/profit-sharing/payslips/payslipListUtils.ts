import dayjs, { type Dayjs } from 'dayjs';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const resolvePayslipMonth = (month: string | null, fallback: Dayjs = dayjs()): Dayjs => {
  if (!month || !MONTH_PATTERN.test(month)) {
    return fallback;
  }

  const parsed = dayjs(`${month}-01`);
  return parsed.isValid() && parsed.format('YYYY-MM') === month ? parsed : fallback;
};
