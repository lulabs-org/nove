import {
  parsePlaybackQuestion,
  recentShanghaiRange,
} from './playback-question.util';

describe('parsePlaybackQuestion', () => {
  const question = '过去两三天我都没来，张老师那边、叶老师那边都讲了什么？';

  it('reads the absence catch-up question as three days and two teachers', () => {
    expect(parsePlaybackQuestion(question)).toEqual({
      absence: true,
      teachers: ['张老师', '叶老师'],
      dayCount: 3,
      yesterday: false,
      today: false,
    });
  });

  it('does not swallow the date into the teacher name', () => {
    expect(parsePlaybackQuestion('过去三天张老师讲了什么').teachers).toEqual([
      '张老师',
    ]);
  });

  it('treats 过去两天 as two days', () => {
    expect(parsePlaybackQuestion('过去两天叶老师讲了什么').dayCount).toBe(2);
  });

  it('uses the last three Shanghai calendar days, including today', () => {
    const now = new Date('2026-11-05T07:00:00.000Z');
    const range = recentShanghaiRange(3, now);

    expect(range.startAt.toISOString()).toBe('2026-11-02T16:00:00.000Z');
    expect(range.endAt.toISOString()).toBe('2026-11-05T07:00:00.000Z');
  });
});
