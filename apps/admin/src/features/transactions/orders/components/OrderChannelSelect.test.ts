import { describe, expect, it } from 'vitest';
import {
  formatOrderChannelOption,
  formatOrderChannelRelation,
  mergeOrderChannelOptions,
} from './orderChannelOptions';

describe('OrderChannelSelect option formatting', () => {
  const channel = { id: 1, name: '微信小店', code: 'WECHAT_STORE' };

  it('shows channel name and code while retaining the numeric ID as value', () => {
    expect(formatOrderChannelOption(channel)).toEqual({
      value: 1,
      label: '微信小店 · WECHAT_STORE',
    });
  });

  it('uses the existing order channel for edit-form display', () => {
    expect(formatOrderChannelRelation(channel)).toEqual({
      value: 1,
      label: '微信小店 · WECHAT_STORE',
    });
  });

  it('does not duplicate the selected channel when it appears in search results', () => {
    expect(mergeOrderChannelOptions([channel], channel)).toHaveLength(1);
  });
});
