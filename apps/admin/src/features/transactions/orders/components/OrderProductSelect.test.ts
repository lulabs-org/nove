import { describe, expect, it } from 'vitest';
import {
  formatOrderProductOption,
  formatOrderProductRelation,
  mergeOrderProductOptions,
} from './orderProductOptions';

describe('OrderProductSelect option formatting', () => {
  const product = {
    id: 'product-1',
    productCode: 'COURSE-001',
    name: '数字能力训练营',
    price: 788000,
    currency: 'CNY' as const,
  };

  it('shows product details while retaining the product ID as value', () => {
    expect(formatOrderProductOption(product)).toEqual({
      value: 'product-1',
      label: '数字能力训练营 · COURSE-001 · CNY 7,880.00',
    });
  });

  it('uses the existing order product for edit-form display', () => {
    expect(
      formatOrderProductRelation({ id: 'product-1', code: 'COURSE-001', name: '数字能力训练营' })
    ).toEqual({
      value: 'product-1',
      label: '数字能力训练营 · COURSE-001',
    });
  });

  it('does not duplicate the selected product when it appears in search results', () => {
    expect(
      mergeOrderProductOptions([product], {
        id: 'product-1',
        code: 'COURSE-001',
        name: '数字能力训练营',
      })
    ).toHaveLength(1);
  });
});
