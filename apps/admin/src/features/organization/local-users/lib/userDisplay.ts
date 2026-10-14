interface UserIdentity {
  id: string;
  username?: string | null;
  displayName?: string | null;
  profile?: { displayName?: string | null } | null;
}

export function getUserIdentityDisplay(user: UserIdentity) {
  const username = user.username?.trim() || '';
  const displayName = user.displayName?.trim() || user.profile?.displayName?.trim() || '';
  const primary = displayName || username || '未命名用户';

  if (username && username !== primary) {
    return { primary, secondary: `@${username}` };
  }

  if (!username && user.id !== primary) {
    return { primary, secondary: user.id };
  }

  return { primary, secondary: null };
}
