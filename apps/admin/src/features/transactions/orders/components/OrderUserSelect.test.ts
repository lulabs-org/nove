import { describe, expect, it } from 'vitest';
import {
  formatOrderRelationOption,
  formatOrderUserOption,
  mergeOrderUserOptions,
} from './orderUserOptions';

describe('OrderUserSelect option formatting', () => {
  const user = {
    id: 'user-1',
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    countryCode: '+86',
    phone: '13800138000',
    profile: { displayName: '张三' },
  };

  it('shows administrator-facing identity while retaining the user ID as value', () => {
    expect(formatOrderUserOption(user)).toEqual({
      value: 'user-1',
      label: '张三 · zhangsan@example.com · +86 13800138000',
    });
  });

  it('uses the existing order relation for edit-form display', () => {
    expect(
      formatOrderRelationOption({
        id: 'user-1',
        code: 'zhangsan',
        name: '张三',
        email: 'zhangsan@example.com',
      })
    ).toEqual({
      value: 'user-1',
      label: '张三 · zhangsan@example.com',
    });
  });

  it('does not duplicate the selected relation when it appears in search results', () => {
    expect(
      mergeOrderUserOptions([user], {
        id: 'user-1',
        name: '张三',
        email: 'zhangsan@example.com',
      })
    ).toHaveLength(1);
  });
});
