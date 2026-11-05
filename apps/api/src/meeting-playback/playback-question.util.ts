import { DateTime } from 'luxon';

const ABSENCE_PATTERN = /没来|没上课|缺席|请假|落下|补课|没听到|没赶上|都没去/;

const TEACHER_PATTERN = /([\u4e00-\u9fa5]{1,8})老师/g;
const TEACHER_NOISE =
  /^(?:过去|最近|这个|这|昨天|今天|前天|的|和|跟|与|向|问|找|看|听|了|在|把|被|从|对|给|让|请|帮|我|你|他|她|们|都|没|不|来|去|上|课|讲|什么|那边|这边|两|二|三|四|五|六|七|八|九|十|天|日|号|几)+/;

const RECENT_DAY_PATTERN =
  /(?:过去|最近|这)\s*([0-9]{1,2}|[一两三四五六七八九十]{1,3})\s*天/;

const NUMBER_WORDS: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

export interface ParsedPlaybackQuestion {
  absence: boolean;
  teachers: string[];
  dayCount: number | null;
  yesterday: boolean;
  today: boolean;
}

export function parsePlaybackQuestion(
  question: string | undefined,
): ParsedPlaybackQuestion {
  const text = question?.trim() ?? '';
  if (!text) {
    return {
      absence: false,
      teachers: [],
      dayCount: null,
      yesterday: false,
      today: false,
    };
  }

  const teachers = [
    ...new Set(
      Array.from(text.matchAll(TEACHER_PATTERN), (match) =>
        normalizeTeacher(match[1]),
      ).filter((teacher): teacher is string => Boolean(teacher)),
    ),
  ];

  return {
    absence: ABSENCE_PATTERN.test(text),
    teachers,
    dayCount: parseDayCount(text),
    yesterday: text.includes('昨天'),
    today: text.includes('今天') && !text.includes('昨天'),
  };
}

export function recentShanghaiRange(
  dayCount: number,
  now: Date,
): { startAt: Date; endAt: Date } {
  const end = DateTime.fromJSDate(now, { zone: 'Asia/Shanghai' });
  const start = end.startOf('day').minus({ days: dayCount - 1 });
  return { startAt: start.toJSDate(), endAt: end.toJSDate() };
}

export function shanghaiDayRange(
  now: Date,
  offsetDays: number,
): { startAt: Date; endAt: Date } {
  const local = DateTime.fromJSDate(now, { zone: 'Asia/Shanghai' });
  const start = local.startOf('day').minus({ days: offsetDays });
  const end = offsetDays === 0 ? local.endOf('day') : start.endOf('day');
  return { startAt: start.toJSDate(), endAt: end.toJSDate() };
}

function normalizeTeacher(raw: string): string | null {
  const name = raw.replace(TEACHER_NOISE, '');
  if (!name || name.length > 4) return null;
  return `${name}老师`;
}

function parseDayCount(text: string): number | null {
  if (/[两二]三天|两三天|过去两三|最近两三|这两三/.test(text)) {
    return 3;
  }

  const match = text.match(RECENT_DAY_PATTERN);
  if (!match) {
    if (/这几天|最近几天|过去几天/.test(text)) return 3;
    return null;
  }

  return parseCountToken(match[1]);
}

function parseCountToken(token: string): number | null {
  if (token === '两三' || token === '二三') return 3;
  if (/^\d+$/.test(token)) {
    const value = Number(token);
    return value > 0 ? value : null;
  }
  if (token.length === 1) return NUMBER_WORDS[token] ?? null;
  return null;
}
