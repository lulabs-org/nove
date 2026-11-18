import type { User } from '../../features/auth/model/types';

interface AuthSnapshot {
  isAuthenticated: boolean;
  user: User | null;
}

const ANONYMOUS_ACCOUNT = 'anonymous';

/**
 * Identifies whose data the query cache may hold: the signed-in user and their
 * current organization. Token refreshes for the same account keep the same key.
 */
export function selectAccountKey({ isAuthenticated, user }: AuthSnapshot): string {
  if (!isAuthenticated || !user) return ANONYMOUS_ACCOUNT;
  return `${user.id}:${user.currentOrgId ?? ''}`;
}
