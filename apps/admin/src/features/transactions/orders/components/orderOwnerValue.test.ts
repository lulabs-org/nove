import { describe, expect, it } from 'vitest';
import { toNullableOrderOwnerId } from './orderOwnerValue';

describe('toNullableOrderOwnerId', () => {
  it('keeps the selected owner ID', () => {
    expect(toNullableOrderOwnerId(' user-1 ')).toBe('user-1');
  });

  it.each([undefined, null, '', '  '])('sends null when the owner is cleared (%s)', (value) => {
    expect(toNullableOrderOwnerId(value)).toBeNull();
  });
});
