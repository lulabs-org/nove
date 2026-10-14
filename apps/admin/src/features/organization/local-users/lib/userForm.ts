import type { AdminUser, UserWritePayload } from '../types';

export function userToFormValues(user: AdminUser): UserWritePayload {
  return {
    username: user.username ?? undefined,
    email: user.email ?? undefined,
    countryCode: user.countryCode ?? '+86',
    phone: user.phone ?? undefined,
    displayName: user.profile?.displayName ?? undefined,
    bio: user.profile?.bio ?? undefined,
    fullName: user.profile?.fullName ?? undefined,
    dateOfBirth: user.profile?.dateOfBirth?.slice(0, 10) ?? undefined,
    gender: user.profile?.gender ?? undefined,
    address: user.profile?.address ?? undefined,
    city: user.profile?.city ?? undefined,
    country: user.profile?.country ?? undefined,
    zipCode: user.profile?.zipCode ?? undefined,
    website: user.profile?.website ?? undefined,
    active: user.active,
  };
}

export function normalizeUserPayload(values: UserWritePayload): UserWritePayload {
  const text = (value?: string | null) => value?.trim() || null;
  const phone = text(values.phone)?.replace(/\D/g, '') || null;
  return {
    username: text(values.username),
    email: text(values.email)?.toLowerCase(),
    countryCode: phone ? text(values.countryCode) : null,
    phone,
    displayName: text(values.displayName),
    bio: text(values.bio),
    fullName: text(values.fullName),
    dateOfBirth: text(values.dateOfBirth),
    gender: values.gender ?? null,
    address: text(values.address),
    city: text(values.city),
    country: text(values.country),
    zipCode: text(values.zipCode),
    website: text(values.website),
    active: values.active ?? true,
  };
}

export function validateUserPayload(values: UserWritePayload): string | null {
  const normalized = normalizeUserPayload(values);
  if (!normalized.username && !normalized.email && !normalized.phone) {
    return '用户名、邮箱、手机号至少填写一个';
  }
  if (normalized.phone && !normalized.countryCode) return '填写手机号时必须提供国家代码';
  if (normalized.countryCode && !normalized.phone) return '填写国家代码时必须提供手机号';
  return null;
}

export function validateImportFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['csv', 'xlsx'].includes(extension)) {
    return '仅支持 CSV 或 XLSX 文件';
  }
  if (file.size > 5 * 1024 * 1024) return '文件不能超过 5 MB';
  return null;
}
