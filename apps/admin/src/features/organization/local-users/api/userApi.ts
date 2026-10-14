import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  AdminUser,
  DocumentVerifyStatus,
  IdentityDocument,
  IdentityDocumentWritePayload,
  UserImportResponse,
  UserListParams,
  UserListResponse,
  UserWritePayload,
} from '../types';

function queryString(params: UserListParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const userApi = {
  list(params: UserListParams = {}): Promise<UserListResponse> {
    return mutator({ url: `/admin/users${queryString(params)}`, method: 'GET' });
  },

  getById(id: string): Promise<AdminUser> {
    return mutator({ url: `/admin/users/${id}`, method: 'GET' });
  },

  create(data: UserWritePayload): Promise<AdminUser> {
    return mutator({ url: '/admin/users', method: 'POST', data });
  },

  update(id: string, data: UserWritePayload): Promise<AdminUser> {
    return mutator({ url: `/admin/users/${id}`, method: 'PATCH', data });
  },

  delete(id: string): Promise<void> {
    return mutator({ url: `/admin/users/${id}`, method: 'DELETE' });
  },

  import(file: File): Promise<UserImportResponse> {
    const data = new FormData();
    data.append('file', file);
    return mutator({
      url: '/admin/users/import',
      method: 'POST',
      data,
      timeout: 60_000,
    });
  },

  listIdentityDocuments(userId: string): Promise<IdentityDocument[]> {
    return mutator({ url: `/admin/users/${userId}/identity-documents`, method: 'GET' });
  },

  createIdentityDocument(
    userId: string,
    data: IdentityDocumentWritePayload
  ): Promise<IdentityDocument> {
    return mutator({ url: `/admin/users/${userId}/identity-documents`, method: 'POST', data });
  },

  updateIdentityDocument(
    userId: string,
    documentId: string,
    data: IdentityDocumentWritePayload
  ): Promise<IdentityDocument> {
    return mutator({
      url: `/admin/users/${userId}/identity-documents/${documentId}`,
      method: 'PATCH',
      data,
    });
  },

  submitIdentityDocument(userId: string, documentId: string): Promise<IdentityDocument> {
    return mutator({
      url: `/admin/users/${userId}/identity-documents/${documentId}/submit`,
      method: 'POST',
    });
  },

  reviewIdentityDocument(
    userId: string,
    documentId: string,
    status: Extract<DocumentVerifyStatus, 'VERIFIED' | 'REJECTED'>,
    rejectReason?: string
  ): Promise<IdentityDocument> {
    return mutator({
      url: `/admin/users/${userId}/identity-documents/${documentId}/review`,
      method: 'POST',
      data: { status, rejectReason },
    });
  },

  deleteIdentityDocument(userId: string, documentId: string): Promise<void> {
    return mutator({
      url: `/admin/users/${userId}/identity-documents/${documentId}`,
      method: 'DELETE',
    });
  },
};
