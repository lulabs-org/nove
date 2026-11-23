import { describe, expect, it } from 'vitest';
import {
  MAX_ORDER_TAG_LENGTH,
  MAX_ORDER_TAGS,
  normalizeOrderTags,
  validateOrderTags,
} from './orderTags';

describe('normalizeOrderTags', () => {
  it('trims, drops blanks and de-duplicates while keeping order', () => {
    expect(normalizeOrderTags([' 乙 ', '甲', '乙', '  ', '丙'])).toEqual(['乙', '甲', '丙']);
  });

  it('returns an empty array for missing input', () => {
    expect(normalizeOrderTags(undefined)).toEqual([]);
    expect(normalizeOrderTags(null)).toEqual([]);
  });
});

describe('validateOrderTags', () => {
  it('accepts empty input so tags can be cleared', () => {
    expect(validateOrderTags([])).toBeUndefined();
    expect(validateOrderTags(undefined)).toBeUndefined();
  });

  it('accepts exactly the maximum number of tags and characters', () => {
    const tags = Array.from({ length: MAX_ORDER_TAGS }, (_, i) =>
      `${i}`.padEnd(MAX_ORDER_TAG_LENGTH, 'x')
    );
    expect(validateOrderTags(tags)).toBeUndefined();
  });

  it('rejects more than the maximum number of distinct tags', () => {
    const tags = Array.from({ length: MAX_ORDER_TAGS + 1 }, (_, i) => `tag-${i}`);
    expect(validateOrderTags(tags)).toContain(`最多添加 ${MAX_ORDER_TAGS} 个标签`);
  });

  it('counts tags after normalization', () => {
    const tags = [
      ...Array.from({ length: MAX_ORDER_TAGS }, (_, i) => `tag-${i}`),
      ' tag-0 ',
      '   ',
    ];
    expect(validateOrderTags(tags)).toBeUndefined();
  });

  it('rejects a tag longer than the maximum length', () => {
    const message = validateOrderTags(['ok', 'a'.repeat(MAX_ORDER_TAG_LENGTH + 1)]);
    expect(message).toContain(`不能超过 ${MAX_ORDER_TAG_LENGTH} 个字符`);
  });

  it('measures length after trimming', () => {
    expect(validateOrderTags([`  ${'a'.repeat(MAX_ORDER_TAG_LENGTH)}  `])).toBeUndefined();
  });
});
