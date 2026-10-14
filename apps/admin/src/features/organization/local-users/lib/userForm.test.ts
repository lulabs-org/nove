import { describe, expect, it } from 'vitest';
import {
  normalizeUserPayload,
  userToFormValues,
  validateImportFile,
  validateUserPayload,
} from './userForm';
import type { AdminUser } from '../types';

describe('user form helpers', () => {
  it('normalizes contact information', () => {
    expect(
      normalizeUserPayload({
        email: ' User@Example.COM ',
        countryCode: ' +86 ',
        phone: '138 0013 8000',
        bio: ' 个人简介 ',
        gender: 'FEMALE',
        dateOfBirth: '2000-01-02',
      })
    ).toMatchObject({
      email: 'user@example.com',
      countryCode: '+86',
      phone: '13800138000',
      active: true,
      bio: '个人简介',
      gender: 'FEMALE',
      dateOfBirth: '2000-01-02',
    });
  });

  it('requires at least one identifier', () => {
    expect(validateUserPayload({ displayName: '匿名用户' })).toBe(
      '用户名、邮箱、手机号至少填写一个'
    );
  });

  it('requires a country code with phone', () => {
    expect(validateUserPayload({ phone: '13800138000' })).toBe('填写手机号时必须提供国家代码');
  });

  it('accepts CSV and XLSX files only', () => {
    expect(validateImportFile(new File(['email\na@example.com'], 'users.csv'))).toBeNull();
    expect(validateImportFile(new File(['x'], 'users.xls'))).toBe('仅支持 CSV 或 XLSX 文件');
  });

  it('maps account and profile detail into edit form values', () => {
    const user: AdminUser = {
      id: 'user-1',
      username: 'zhangsan',
      email: 'zhangsan@example.com',
      countryCode: '+86',
      phone: '13800138000',
      active: true,
      emailVerified: true,
      phoneVerified: false,
      lastLoginAt: null,
      createdAt: '2026-08-12T00:00:00.000Z',
      updatedAt: '2026-08-12T00:00:00.000Z',
      profile: {
        displayName: '张三',
        avatar: 'https://example.com/avatar.png',
        bio: '个人简介',
        fullName: '张三',
        dateOfBirth: '2000-01-02T00:00:00.000Z',
        gender: 'MALE',
        address: '示例路 1 号',
        city: '上海',
        country: '中国',
        zipCode: '200000',
        website: 'https://example.com',
      },
    };

    const values = userToFormValues(user);

    expect(values).toMatchObject({
      username: 'zhangsan',
      email: 'zhangsan@example.com',
      displayName: '张三',
      fullName: '张三',
      dateOfBirth: '2000-01-02',
      gender: 'MALE',
      active: true,
    });
    expect(values).not.toHaveProperty('avatar');
  });
});
