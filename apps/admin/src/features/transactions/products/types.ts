import type { TableQueryResult } from '../../../shared/hooks/useTableQuery';

export type ProductCategory = 'COURSE' | 'MEMBERSHIP' | 'CONSULTATION' | 'MATERIAL' | 'OTHER';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
export type Currency =
  | 'CNY'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'HKD'
  | 'TWD'
  | 'SGD'
  | 'AUD'
  | 'CAD';

export interface Product {
  id: string;
  productCode: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  category: ProductCategory;
  status: ProductStatus;
  price: number | null;
  originalPrice: number | null;
  currency: Currency;
  durationDays: number | null;
  maxUsers: number | null;
  tags: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  downloadUrl: string | null;
  externalUrl: string | null;
  sortOrder: number;
  isRecommended: boolean;
  isFeatured: boolean;
  salesCount: number;
  viewCount: number;
  rating: number | null;
  reviewCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  currency?: Currency;
  isRecommended?: boolean;
  isFeatured?: boolean;
  sortField?: 'createdAt' | 'updatedAt' | 'name' | 'price' | 'sortOrder' | 'salesCount';
  sortOrder?: 'asc' | 'desc';
}

export type ProductListData = TableQueryResult<Product> & { totalPages?: number };

export interface CreateProduct {
  productCode: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  category: ProductCategory;
  status?: ProductStatus;
  price?: number | null;
  originalPrice?: number | null;
  currency?: Currency;
  durationDays?: number | null;
  maxUsers?: number | null;
  tags?: string[];
  imageUrl?: string | null;
  videoUrl?: string | null;
  downloadUrl?: string | null;
  externalUrl?: string | null;
  sortOrder?: number;
  isRecommended?: boolean;
  isFeatured?: boolean;
  rating?: number | null;
  publishedAt?: string | null;
}

export type UpdateProduct = Partial<CreateProduct>;
