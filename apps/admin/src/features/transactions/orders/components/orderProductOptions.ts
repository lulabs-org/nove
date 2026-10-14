import type { OrderProductOption, OrderRelation } from '../types';

export interface ProductSelectOption {
  value: string;
  label: string;
}

export function formatOrderProductOption(product: OrderProductOption): ProductSelectOption {
  const price =
    product.price == null
      ? null
      : `${product.currency} ${(product.price / 100).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return {
    value: product.id,
    label: [product.name, product.productCode, price].filter(Boolean).join(' · '),
  };
}

export function formatOrderProductRelation(
  product?: OrderRelation | null
): ProductSelectOption | null {
  if (!product) return null;
  const value = String(product.id);
  const productName = product.name || product.code || value;
  return {
    value,
    label:
      product.code && product.code !== productName
        ? `${productName} · ${product.code}`
        : productName,
  };
}

export function mergeOrderProductOptions(
  products: OrderProductOption[],
  initialProduct?: OrderRelation | null
): ProductSelectOption[] {
  const options = products.map(formatOrderProductOption);
  const initialOption = formatOrderProductRelation(initialProduct);
  if (initialOption && !options.some((option) => option.value === initialOption.value)) {
    options.unshift(initialOption);
  }
  return options;
}
