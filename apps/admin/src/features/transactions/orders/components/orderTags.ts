// 与 API CreateOrderDto 的校验保持一致：每个订单最多 50 个标签，每个标签最多 50 个字符
export const MAX_ORDER_TAGS = 50;
export const MAX_ORDER_TAG_LENGTH = 50;

/** trim、去空、去重，保留首次出现的顺序（与提交给 API 的数据一致）。 */
export function normalizeOrderTags(tags?: string[] | null): string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

/** 校验规范化后的标签；通过时返回 undefined，空数组视为合法（用于清空标签）。 */
export function validateOrderTags(tags?: string[] | null): string | undefined {
  const normalized = normalizeOrderTags(tags);

  if (normalized.length > MAX_ORDER_TAGS) {
    return `最多添加 ${MAX_ORDER_TAGS} 个标签，当前 ${normalized.length} 个`;
  }

  const tooLong = normalized.filter((tag) => tag.length > MAX_ORDER_TAG_LENGTH);
  if (tooLong.length > 0) {
    const preview = tooLong[0].slice(0, 10);
    return `标签不能超过 ${MAX_ORDER_TAG_LENGTH} 个字符：「${preview}…」${
      tooLong.length > 1 ? ` 等 ${tooLong.length} 个` : ''
    }`;
  }

  return undefined;
}
