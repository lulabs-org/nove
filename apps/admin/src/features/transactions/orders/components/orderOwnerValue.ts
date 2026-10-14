export function toNullableOrderOwnerId(value?: string | null): string | null {
  return value?.trim() || null;
}
