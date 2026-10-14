import { describe, expect, it } from 'vitest';
import {
  buildCronExpression,
  describeCronExpression,
  getCronError,
  getNextCronRuns,
  inferScheduleDraft,
} from './taskScheduling';

describe('taskScheduling', () => {
  it('builds six-part cron expressions for every visual mode', () => {
    expect(
      buildCronExpression({
        mode: 'MINUTELY',
        interval: 15,
        minute: 0,
        hour: 9,
        weekdays: [1],
        monthDays: [1],
      })
    ).toBe('0 */15 * * * *');

    expect(
      buildCronExpression({
        mode: 'WEEKLY',
        interval: 5,
        minute: 15,
        hour: 10,
        weekdays: [1, 2, 3, 4, 5],
        monthDays: [1],
      })
    ).toBe('0 15 10 * * 1,2,3,4,5');
  });

  it('infers visual modes from existing five and six-part expressions', () => {
    expect(inferScheduleDraft('0 9 * * *')).toMatchObject({
      mode: 'DAILY',
      hour: 9,
      minute: 0,
    });
    expect(inferScheduleDraft('0 30 * * * *')).toMatchObject({
      mode: 'HOURLY',
      minute: 30,
    });
    expect(inferScheduleDraft('0 15 10 * * 1-5').mode).toBe('ADVANCED');
  });

  it('validates expressions with the same parser used for previews', () => {
    expect(getCronError('0 15 10 * * 1-5', 'Asia/Shanghai')).toBeNull();
    expect(getCronError('not a cron', 'Asia/Shanghai')).toContain('格式不正确');
    expect(getCronError('0 0 0 31 2 *', 'Asia/Shanghai')).toContain('没有可执行的日期');
  });

  it('provides a Chinese description and five increasing future runs', () => {
    const expression = '0 0 9 * * *';
    expect(describeCronExpression(expression)).not.toBe(expression);

    const runs = getNextCronRuns(expression, 'Asia/Shanghai');
    expect(runs).toHaveLength(5);
    expect(
      runs.every((date, index) => index === 0 || date.getTime() > runs[index - 1]!.getTime())
    ).toBe(true);
  });
});
