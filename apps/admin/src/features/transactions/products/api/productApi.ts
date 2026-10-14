import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  CreateProduct,
  Product,
  ProductListData,
  ProductListParams,
  ProductStatus,
  UpdateProduct,
} from '../types';

interface RawProductList {
  items?: Product[];
  data?: Product[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

const cleanParams = (params: ProductListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));

export const productApi = {
  async list(params: ProductListParams): Promise<ProductListData> {
    const result = await mutator<RawProductList>({
      url: '/admin/products',
      method: 'GET',
      params: cleanParams(params),
    });
    return {
      data: result.items ?? result.data ?? [],
      total: result.total ?? 0,
      page: result.page ?? params.page ?? 1,
      pageSize: result.pageSize ?? params.pageSize ?? 10,
      totalPages: result.totalPages,
    };
  },

  getById(id: string): Promise<Product> {
    return mutator<Product>({ url: `/admin/products/${id}`, method: 'GET' });
  },

  create(data: CreateProduct): Promise<Product> {
    return mutator<Product>({
      url: '/admin/products',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  update(id: string, data: UpdateProduct): Promise<Product> {
    return mutator<Product>({
      url: `/admin/products/${id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  },

  updateStatus(id: string, status: ProductStatus): Promise<Product> {
    return mutator<Product>({
      url: `/admin/products/${id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: { status },
    });
  },

  delete(id: string): Promise<void> {
    return mutator<void>({ url: `/admin/products/${id}`, method: 'DELETE' });
  },
};
