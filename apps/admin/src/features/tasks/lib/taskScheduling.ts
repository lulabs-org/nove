import { parseExpression } from 'cron-parser';
import cronstrue from 'cronstrue/i18n';

export type ScheduleMode = 'MINUTELY' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ADVANCED';

export interface ScheduleDraft {
  mode: ScheduleMode;
  interval: number;
  minute: number;
  hour: number;
  weekdays: number[];
  monthDays: number[];
}

export const DEFAULT_SCHEDULE_DRAFT: ScheduleDraft = {
  mode: 'DAILY',
  interval: 5,
  minute: 0,
  hour: 9,
  weekdays: [1],
  monthDays: [1],
};

export function buildCronExpression(draft: ScheduleDraft): string {
  switch (draft.mode) {
    case 'MINUTELY':
      return `0 */${draft.interval} * * * *`;
    case 'HOURLY':
      return `0 ${draft.minute} * * * *`;
    case 'DAILY':
      return `0 ${draft.minute} ${draft.hour} * * *`;
    case 'WEEKLY':
      return `0 ${draft.minute} ${draft.hour} * * ${draft.weekdays.join(',')}`;
    case 'MONTHLY':
      return `0 ${draft.minute} ${draft.hour} ${draft.monthDays.join(',')} * *`;
    case 'ADVANCED':
      return '';
  }
}

export function inferScheduleDraft(expression?: string | null): ScheduleDraft {
  if (!expression) return DEFAULT_SCHEDULE_DRAFT;

  const fields = expression.trim().split(/\s+/);
  const normalized = fields.length === 5 ? ['0', ...fields] : fields;
  if (normalized.length !== 6 || normalized[0] !== '0') {
    return { ...DEFAULT_SCHEDULE_DRAFT, mode: 'ADVANCED' };
  }

  const [, minute, hour, dayOfMonth, month, dayOfWeek] = normalized;
  const numericMinute = Number(minute);
  const numericHour = Number(hour);

  if (
    /^\*\/\d+$/.test(minute) &&
    hour === '*' &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return {
      ...DEFAULT_SCHEDULE_DRAFT,
      mode: 'MINUTELY',
      interval: Number(minute.slice(2)),
    };
  }

  if (
    Number.isInteger(numericMinute) &&
    hour === '*' &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return { ...DEFAULT_SCHEDULE_DRAFT, mode: 'HOURLY', minute: numericMinute };
  }

  if (Number.isInteger(numericMinute) && Number.isInteger(numericHour) && month === '*') {
    if (dayOfMonth === '*' && dayOfWeek === '*') {
      return {
        ...DEFAULT_SCHEDULE_DRAFT,
        mode: 'DAILY',
        minute: numericMinute,
        hour: numericHour,
      };
    }

    if (dayOfMonth === '*' && /^\d(?:,\d)*$/.test(dayOfWeek)) {
      return {
        ...DEFAULT_SCHEDULE_DRAFT,
        mode: 'WEEKLY',
        minute: numericMinute,
        hour: numericHour,
        weekdays: dayOfWeek.split(',').map(Number),
      };
    }

    if (dayOfWeek === '*' && /^\d{1,2}(?:,\d{1,2})*$/.test(dayOfMonth)) {
      return {
        ...DEFAULT_SCHEDULE_DRAFT,
        mode: 'MONTHLY',
        minute: numericMinute,
        hour: numericHour,
        monthDays: dayOfMonth.split(',').map(Number),
      };
    }
  }

  return { ...DEFAULT_SCHEDULE_DRAFT, mode: 'ADVANCED' };
}

export function getCronError(expression?: string | null, timezone?: string): string | null {
  if (!expression?.trim()) return '请输入 Cron 表达式';

  let interval;
  try {
    interval = parseExpression(expression, { tz: timezone || 'Asia/Shanghai' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid explicit day')) {
      return '该计划没有可执行的日期，请检查日期与月份组合';
    }
    return 'Cron 表达式格式不正确，请检查秒、分钟、小时、日期、月份和星期';
  }

  try {
    interval.next();
    return null;
  } catch {
    return '该计划没有可执行的日期，请检查日期与月份组合';
  }
}

export function describeCronExpression(expression?: string | null): string {
  if (!expression) return '-';

  try {
    return cronstrue.toString(expression, {
      locale: 'zh_CN',
      use24HourTimeFormat: true,
      throwExceptionOnParseError: true,
    });
  } catch {
    return expression;
  }
}

export function getNextCronRuns(
  expression?: string | null,
  timezone = 'Asia/Shanghai',
  count = 5
): Date[] {
  if (getCronError(expression, timezone) || !expression) return [];

  try {
    const interval = parseExpression(expression, { tz: timezone });
    return Array.from({ length: count }, () => interval.next().toDate());
  } catch {
    return [];
  }
}

export function formatInTimezone(value: Date, timezone: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(value);
}
