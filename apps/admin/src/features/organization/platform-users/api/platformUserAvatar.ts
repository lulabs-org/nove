// Nullable avatar fields currently appear as objects in the OpenAPI schema.
// Narrow the actual value at the API boundary before rendering an image.
export function normalizePlatformUserAvatar<T extends { avatarUrl?: unknown }>(
  user: T
): Omit<T, 'avatarUrl'> & { avatarUrl?: string | null } {
  return {
    ...user,
    avatarUrl: typeof user.avatarUrl === 'string' || user.avatarUrl == null ? user.avatarUrl : null,
  };
}
