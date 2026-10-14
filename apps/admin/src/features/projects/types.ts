import type { TableQueryResult } from '../../shared/hooks/useTableQuery';

export type ProjectStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ENROLLING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ProjectLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ProjectOwner {
  id: string;
  displayName: string;
}

export interface ProjectOwnerListParams {
  keyword: string;
}

export interface ProjectOwnerListResponse {
  items: ProjectOwner[];
}

export interface ProjectProduct {
  id: string;
  productCode: string;
  name: string;
  status: string;
}

export interface Project {
  id: string;
  orgId: string;
  title: string;
  subtitle: string | null;
  code: string | null;
  slug: string | null;
  category: string | null;
  image: string | null;
  description: string | null;
  level: ProjectLevel;
  duration: string | null;
  maxStudents: number | null;
  enrolledCount: number;
  prerequisites: string[] | null;
  outcomes: string[] | null;
  tags: string[];
  ownerId: string | null;
  productId: string | null;
  owner: ProjectOwner | null;
  product: ProjectProduct | null;
  status: ProjectStatus;
  sortOrder: number;
  isFeatured: boolean;
  startDate: string | null;
  endDate: string | null;
  enrollDeadline: string | null;
  publishedAt: string | null;
  createdById: string | null;
  updatedById: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: ProjectStatus;
  level?: ProjectLevel;
  isFeatured?: boolean;
  ownerId?: string;
  productId?: string;
  sortField?: 'createdAt' | 'updatedAt' | 'title' | 'sortOrder' | 'startDate' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export type ProjectListData = TableQueryResult<Project> & { totalPages?: number };

export interface CreateProject {
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  category?: string | null;
  image?: string | null;
  description?: string | null;
  level?: ProjectLevel;
  duration?: string | null;
  maxStudents?: number | null;
  prerequisites?: string[] | null;
  outcomes?: string[] | null;
  tags?: string[];
  ownerId?: string | null;
  productId?: string | null;
  status?: ProjectStatus;
  sortOrder?: number;
  isFeatured?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  enrollDeadline?: string | null;
  metadata?: Record<string, unknown>;
}

export type UpdateProject = Partial<CreateProject>;
