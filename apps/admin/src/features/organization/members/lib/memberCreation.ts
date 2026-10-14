import axios from 'axios';
import type { CreateOrgMember } from '../api/orgMemberApi';

export const DEFAULT_MEMBER_COUNTRY_CODE = '+86';

export interface CreateMemberFormValues {
  email?: string;
  countryCode?: string;
  phone?: string;
  type?: 'INTERNAL' | 'EXTERNAL';
  orgDisplayName?: string;
  employeeNo?: string;
  primaryDeptId?: string;
  roleIds?: string[];
  externalCompany?: string;
  title?: string;
}

export function hasMemberContact(email?: string, phone?: string) {
  return Boolean(email?.trim() || phone?.trim());
}

export function buildCreateMemberPayload(
  values: CreateMemberFormValues,
  departmentIds: string[]
): CreateOrgMember {
  return {
    email: values.email?.trim().toLowerCase() || undefined,
    countryCode: values.phone?.trim() ? values.countryCode?.trim() : undefined,
    phone: values.phone?.trim() || undefined,
    type: values.type,
    orgDisplayName: values.orgDisplayName?.trim() || undefined,
    employeeNo: values.employeeNo?.trim() || undefined,
    primaryDeptId: values.primaryDeptId || undefined,
    departmentIds,
    roleIds: values.roleIds,
    externalCompany: values.externalCompany?.trim() || undefined,
    title: values.title?.trim() || undefined,
  };
}

export function getMemberApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const apiMessage = error.response?.data?.message;
    if (Array.isArray(apiMessage)) return apiMessage.join('；');
    if (apiMessage) return apiMessage;
  }
  return fallback;
}
