export interface AdminUserProfile {
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: UserGender | null;
  address: string | null;
  city: string | null;
  country: string | null;
  zipCode: string | null;
  website: string | null;
}

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface AdminUser {
  id: string;
  username: string | null;
  email: string | null;
  displayName?: string | null;
  fullName?: string | null;
  avatar?: string | null;
  countryCode: string | null;
  phone: string | null;
  active: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: AdminUserProfile | null;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  active?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'username' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserWritePayload {
  username?: string | null;
  email?: string | null;
  countryCode?: string | null;
  phone?: string | null;
  displayName?: string | null;
  bio?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  zipCode?: string | null;
  website?: string | null;
  active?: boolean;
}

export interface UserImportFailure {
  row: number;
  identifier: string | null;
  code: string;
  reason: string;
}

export interface UserImportResponse {
  total: number;
  successCount: number;
  failureCount: number;
  failures: UserImportFailure[];
}

export type IdentityDocumentType =
  | 'ID_CARD'
  | 'PASSPORT'
  | 'HOUSEHOLD_REGISTER'
  | 'HK_MACAO_PERMIT'
  | 'TAIWAN_PERMIT'
  | 'FOREIGN_PERMANENT_RESIDENT'
  | 'OTHER';

export type DocumentVerifyStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface IdentityDocumentFile {
  driveFileId: string;
  name: string;
  contentType: string;
}

export interface IdentityDocument {
  id: string;
  userId: string;
  documentType: IdentityDocumentType;
  issuingCountry: string;
  holderName: string;
  maskedNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  isPermanent: boolean;
  issuingAuthority: string | null;
  frontFile: IdentityDocumentFile | null;
  backFile: IdentityDocumentFile | null;
  metadata: Record<string, unknown> | null;
  status: DocumentVerifyStatus;
  rejectReason: string | null;
  verifiedAt: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityDocumentWritePayload {
  documentType?: IdentityDocumentType;
  issuingCountry?: string;
  holderName?: string;
  documentNumber?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  isPermanent?: boolean;
  issuingAuthority?: string | null;
  frontDriveFileId?: string | null;
  backDriveFileId?: string | null;
  isPrimary?: boolean;
}
