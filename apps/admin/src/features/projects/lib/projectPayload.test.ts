import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { buildProjectPayload, parseProjectMetadata } from './projectPayload';

describe('project payload', () => {
  it('normalizes nullable values, lists, dates, and metadata without sending a slug', () => {
    const payload = buildProjectPayload({
      title: ' Project One ',
      subtitle: ' ',
      level: 'BEGINNER',
      maxStudents: 10,
      prerequisites: [{ value: ' TypeScript ' }, { value: 'TypeScript' }],
      outcomes: [{ value: ' Working app ' }],
      tags: [' Web ', 'Web'],
      status: 'PUBLISHED',
      sortOrder: 1,
      isFeatured: true,
      startDate: dayjs('2026-09-01T09:00:00+08:00'),
      metadataText: '{"source":"admin"}',
    });

    expect(payload).toMatchObject({
      title: 'Project One',
      subtitle: null,
      prerequisites: ['TypeScript'],
      outcomes: ['Working app'],
      tags: ['Web'],
      metadata: { source: 'admin' },
    });
    expect(payload).not.toHaveProperty('slug');
    expect(payload.startDate).toMatch(/^2026-09-01T01:00:00/);
  });

  it('accepts an empty metadata object and rejects arrays', () => {
    expect(parseProjectMetadata('')).toEqual({});
    expect(() => parseProjectMetadata('[]')).toThrow('JSON 对象');
  });
});
