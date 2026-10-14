import { describe, expect, it } from 'vitest';
import {
  buildCreateMemberPayload,
  DEFAULT_MEMBER_COUNTRY_CODE,
  getMemberApiErrorMessage,
  hasMemberContact,
} from './memberCreation';

describe('member creation helpers', () => {
  it('defaults new member phone input to the China country code', () => {
    expect(DEFAULT_MEMBER_COUNTRY_CODE).toBe('+86');
  });

  it('requires at least one non-empty contact', () => {
    expect(hasMemberContact('', ' ')).toBe(false);
    expect(hasMemberContact('member@example.com', '')).toBe(true);
    expect(hasMemberContact('', '13800138000')).toBe(true);
  });

  it('builds a normalized request without a userId', () => {
    const payload = buildCreateMemberPayload(
      {
        email: ' Member@Example.COM ',
        countryCode: ' +86 ',
        phone: ' 13800138000 ',
        orgDisplayName: ' 张三 ',
        type: 'INTERNAL',
      },
      ['dept-1']
    );

    expect(payload).toEqual(
      expect.objectContaining({
        email: 'member@example.com',
        countryCode: '+86',
        phone: '13800138000',
        orgDisplayName: '张三',
        departmentIds: ['dept-1'],
      })
    );
    expect(payload).not.toHaveProperty('userId');
  });

  it('surfaces a backend conflict message', () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: '该邮箱和手机号属于不同用户' } },
    };

    expect(getMemberApiErrorMessage(error, '添加成员失败')).toBe('该邮箱和手机号属于不同用户');
  });
});
